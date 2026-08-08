import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { roll } from 'roll-parser';
import { resolveSurface, trackCommand, trackRoll } from '../../src/analytics/track';
import { ROLL_LIMITS } from '../../src/limits';
import { FAKE_SALT, FakeDataset, ThrowingDataset } from '../helpers';

const rolled = (notation: string) => roll(notation, ROLL_LIMITS);

const ROLL_CONTEXT = { command: 'roll', surface: 'private', userId: 1 } as const;

let dataset: FakeDataset;
let error: ReturnType<typeof spyOn<Console, 'error'>>;

beforeEach(() => {
  dataset = new FakeDataset();
  error = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  error.mockRestore();
});

describe('resolveSurface', () => {
  test('passes through known chat types', () => {
    expect(resolveSurface('private')).toBe('private');
    expect(resolveSurface('supergroup')).toBe('supergroup');
  });

  test('falls back to unknown', () => {
    expect(resolveSurface('sender')).toBe('unknown');
    expect(resolveSurface(undefined)).toBe('unknown');
  });
});

describe('trackRoll', () => {
  test('writes one point per term in the documented slot order', async () => {
    await trackRoll(
      { ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT },
      ROLL_CONTEXT,
      rolled('1d20+2d6'),
    );

    expect(dataset.points).toHaveLength(2);
    expect(dataset.points[0].indexes).toEqual(['d20']);
    expect(dataset.points[0].blobs?.slice(0, 4)).toEqual(['roll', '1d20', '', 'private']);
    expect(dataset.points[0].doubles).toEqual([0]);
    expect(dataset.points[1].blobs?.[1]).toBe('2d6');
    expect(dataset.points[1].doubles).toEqual([1]);
  });

  test('hashes the user ID into blobs[4]', async () => {
    await trackRoll({ ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT }, ROLL_CONTEXT, rolled('d20'));

    expect(dataset.points[0].blobs?.[4]).toMatch(/^[0-9a-f]{64}$/);
  });

  test('produces a stable hash for the same user and a different one for another', async () => {
    const env = { ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT };
    await trackRoll(env, ROLL_CONTEXT, rolled('d20'));
    await trackRoll(env, ROLL_CONTEXT, rolled('d20'));
    await trackRoll(env, { ...ROLL_CONTEXT, userId: 2 }, rolled('d20'));

    expect(dataset.points[0].blobs?.[4]).toBe(dataset.points[1].blobs?.[4] as string);
    expect(dataset.points[2].blobs?.[4]).not.toBe(dataset.points[0].blobs?.[4] as string);
  });

  test('still records the roll when the salt or user is missing', async () => {
    await trackRoll({ ANALYTICS: dataset }, ROLL_CONTEXT, rolled('d20'));
    await trackRoll(
      { ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT },
      { ...ROLL_CONTEXT, userId: undefined },
      rolled('d20'),
    );

    expect(dataset.points).toHaveLength(2);
    expect(dataset.points.map((point) => point.blobs?.[4])).toEqual(['', '']);
  });

  test('writes nothing without a binding', async () => {
    await expect(trackRoll({}, ROLL_CONTEXT, rolled('d20'))).resolves.toBeUndefined();
  });

  test('writes nothing for notation that rolls no dice', async () => {
    await trackRoll({ ANALYTICS: dataset }, ROLL_CONTEXT, rolled('1+1'));

    expect(dataset.points).toHaveLength(0);
  });

  test('does not resolve a lazy source when there is no binding', async () => {
    let resolved = false;
    await trackRoll({}, ROLL_CONTEXT, () => {
      resolved = true;
      return rolled('d20');
    });

    expect(resolved).toBe(false);
  });

  test('contains a throw from a lazy source', async () => {
    await expect(
      trackRoll({ ANALYTICS: dataset }, ROLL_CONTEXT, () => {
        throw new Error('resolution failed');
      }),
    ).resolves.toBeUndefined();

    expect(dataset.points).toHaveLength(0);
    expect(error).toHaveBeenCalled();
  });

  test('writes nothing when there is no result to shape', async () => {
    await trackRoll({ ANALYTICS: dataset }, ROLL_CONTEXT, null);

    expect(dataset.points).toHaveLength(0);
    expect(error).not.toHaveBeenCalled();
  });

  test('swallows a malformed result rather than propagating', async () => {
    await trackRoll({ ANALYTICS: dataset }, ROLL_CONTEXT, { parts: null } as never);

    expect(dataset.points).toHaveLength(0);
    expect(error).toHaveBeenCalled();
  });

  test('treats an empty salt as absent instead of failing every write', async () => {
    await trackRoll({ ANALYTICS: dataset, ANALYTICS_SALT: '' }, ROLL_CONTEXT, rolled('d20'));

    expect(dataset.points).toHaveLength(1);
    expect(dataset.points[0].blobs?.[4]).toBe('');
    expect(error).not.toHaveBeenCalled();
  });

  test('swallows a failing dataset', async () => {
    await expect(
      trackRoll({ ANALYTICS: new ThrowingDataset() }, ROLL_CONTEXT, rolled('d20')),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});

describe('trackCommand', () => {
  test('indexes on the command and leaves the term slots empty', async () => {
    await trackCommand(
      { ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT },
      {
        command: 'help',
        surface: 'group',
        userId: 1,
      },
    );

    expect(dataset.points).toHaveLength(1);
    expect(dataset.points[0].indexes).toEqual(['help']);
    expect(dataset.points[0].blobs?.slice(0, 4)).toEqual(['help', '', '', 'group']);
    expect(dataset.points[0].doubles).toEqual([0]);
  });

  test('writes nothing without a binding', async () => {
    await expect(
      trackCommand({}, { command: 'start', surface: 'private', userId: 1 }),
    ).resolves.toBeUndefined();
  });

  test('swallows a failing dataset', async () => {
    await expect(
      trackCommand(
        { ANALYTICS: new ThrowingDataset() },
        {
          command: 'start',
          surface: 'private',
          userId: 1,
        },
      ),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});

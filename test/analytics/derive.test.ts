import { describe, expect, test } from 'bun:test';
import {
  groupBy,
  modifierAdoption,
  modifierTokens,
  systemMix,
  termsPerRoll,
  userStats,
} from '../../scripts/analytics/derive';
import type { Pair, UserDay } from '../../scripts/analytics/queries';

const pairs: Pair[] = [
  { term: '1d20', modifiers: '', n: 60 },
  { term: '2d20', modifiers: 'kh', n: 20 },
  { term: '4d6', modifiers: 'kh', n: 10 },
  { term: '1d8', modifiers: 'r,!', n: 10 },
];

// alice returns the next day, bob never does, carol arrives on the last day and
// so cannot have had the chance
const userDays: UserDay[] = [
  { day: '2026-01-01', user: 'alice', rolls: 10 },
  { day: '2026-01-01', user: 'bob', rolls: 1 },
  { day: '2026-01-02', user: 'alice', rolls: 5 },
  { day: '2026-01-10', user: 'carol', rolls: 4 },
];

describe('systemMix', () => {
  test('collapses shapes onto signals and shares them against the term total', () => {
    expect(systemMix(pairs)).toEqual([
      { id: 'd20', label: 'bare d20', confidence: 'weak', n: 60, share: 0.6 },
      {
        id: 'd20-advantage',
        label: 'd20 advantage / disadvantage',
        confidence: 'strong',
        n: 20,
        share: 0.2,
      },
      {
        id: 'stat-array',
        label: 'ability score array (4d6 drop)',
        confidence: 'strong',
        n: 10,
        share: 0.1,
      },
      { id: 'exploding', label: 'exploding dice', confidence: 'strong', n: 10, share: 0.1 },
    ]);
  });

  test('is empty rather than throwing on no data', () => {
    expect(systemMix([])).toEqual([]);
  });
});

describe('modifierAdoption', () => {
  test('measures modified terms against every term', () => {
    expect(modifierAdoption(pairs)).toEqual({ modified: 40, total: 100, rate: 0.4 });
  });

  test('reports a zero rate rather than dividing by zero', () => {
    expect(modifierAdoption([])).toEqual({ modified: 0, total: 0, rate: 0 });
  });
});

describe('modifierTokens', () => {
  test('credits every token of a compound modifier list', () => {
    expect(modifierTokens(pairs)).toEqual([
      { token: 'kh', n: 30, share: 0.3 },
      { token: 'r', n: 10, share: 0.1 },
      { token: '!', n: 10, share: 0.1 },
    ]);
  });

  test('credits a repeated token once, so no share can exceed the term total', () => {
    // `(4d6kh3)kh2` nests two keep/drops and records `kh,kh`
    expect(modifierTokens([{ term: '4d6', modifiers: 'kh,kh', n: 10 }])).toEqual([
      { token: 'kh', n: 10, share: 1 },
    ]);
  });
});

describe('termsPerRoll', () => {
  test('divides data points by invocations', () => {
    expect(termsPerRoll(150, 100)).toBe(1.5);
  });

  test('returns zero when no rolls were recorded', () => {
    expect(termsPerRoll(10, 0)).toBe(0);
  });
});

describe('groupBy', () => {
  test('folds a two-dimensional fetch onto one axis, ordered by weight', () => {
    const rows = [
      { command: 'roll', surface: 'private', n: 5 },
      { command: 'roll', surface: 'group', n: 3 },
      { command: 'inline', surface: 'inline', n: 12 },
    ];

    expect(
      groupBy(
        rows,
        (row) => row.command,
        (row) => row.n,
      ),
    ).toEqual([
      { key: 'inline', n: 12, share: 0.6 },
      { key: 'roll', n: 8, share: 0.4 },
    ]);
  });
});

describe('userStats', () => {
  const stats = userStats(userDays, { asOf: '2026-01-10' });

  test('counts each user once across days', () => {
    expect(stats.observedUsers).toBe(3);
  });

  test('counts active users per day', () => {
    expect(stats.activePerDay).toEqual([
      { day: '2026-01-01', n: 2 },
      { day: '2026-01-02', n: 1 },
      { day: '2026-01-10', n: 1 },
    ]);
  });

  test('omits the opening day from first sightings when it sits on the window edge', () => {
    const edge = userStats(userDays, { asOf: '2026-01-10', windowStart: '2026-01-01' });
    expect(edge.firstSeenPerDay).toEqual([
      { day: '2026-01-02', n: 0 },
      { day: '2026-01-10', n: 1 },
    ]);
    expect(edge.firstDay).toBe('2026-01-01');
  });

  test('keeps the first active day when the window opened before it', () => {
    // Nobody rolled on 2025-12-20..31, so 2026-01-01 is a real acquisition day
    const inside = userStats(userDays, { asOf: '2026-01-10', windowStart: '2025-12-20' });
    expect(inside.firstSeenPerDay[0]).toEqual({ day: '2026-01-01', n: 2 });
    expect(inside.firstDay).toBeNull();
  });

  test('buckets users by how many days they showed up on', () => {
    expect(stats.activityHistogram).toEqual([
      { activeDays: 1, users: 2 },
      { activeDays: 2, users: 1 },
    ]);
  });

  // Cohorts need a window that opened before the data, or every user is a window-edge
  // sighting rather than an acquisition
  const measurable = userStats(userDays, { asOf: '2026-01-10', windowStart: '2025-12-20' });

  test('excludes cohorts too young to have returned yet', () => {
    // carol first appears on the last observed day, so she is in neither window
    expect(measurable.cohorts.d1).toEqual({ eligible: 2, returned: 1, rate: 0.5 });
    expect(measurable.cohorts.d7).toEqual({ eligible: 2, returned: 1, rate: 0.5 });
  });

  test('excludes the window-edge cohort, whose first sighting is not an acquisition', () => {
    // alice and bob are only "new" because the window opens under them
    const edge = userStats(userDays, { asOf: '2026-01-10', windowStart: '2026-01-01' });
    expect(edge.cohorts.d1).toEqual({ eligible: 0, returned: 0, rate: 0 });
  });

  test('rounds the concentration cut up to at least one user', () => {
    expect(stats.concentration).toEqual([
      { percent: 1, users: 1, share: 0.75 },
      { percent: 5, users: 1, share: 0.75 },
      { percent: 10, users: 1, share: 0.75 },
    ]);
  });

  test('ranks top users by total rolls', () => {
    expect(stats.topUsers).toEqual([
      { user: 'alice', rolls: 15, activeDays: 2 },
      { user: 'carol', rolls: 4, activeDays: 1 },
      { user: 'bob', rolls: 1, activeDays: 1 },
    ]);
  });

  test('keeps measuring after the bot goes quiet', () => {
    // Nobody rolled after 2026-01-10, but bob's D7 window closed long ago and he
    // never came back — reading eligibility off the last active day would hide that
    const later = userStats(userDays, { asOf: '2026-03-01', windowStart: '2025-12-20' });
    expect(later.cohorts.d7).toEqual({ eligible: 3, returned: 1, rate: 1 / 3 });
  });

  test('flags the window edge, where a first sighting may not be a first roll', () => {
    expect(stats.firstDay).toBe('2026-01-01');
  });

  test('survives an empty grid', () => {
    const empty = userStats([]);
    expect(empty.observedUsers).toBe(0);
    expect(empty.firstDay).toBeNull();
    expect(empty.cohorts.d1).toEqual({ eligible: 0, returned: 0, rate: 0 });
    expect(empty.concentration.every((row) => row.share === 0)).toBe(true);
  });
});

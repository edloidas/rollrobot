import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { FAKE_SALT, FakeDataset, TestBot, ThrowingDataset } from './helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Bot message options', () => {
  test('should reply with HTML parse mode', async () => {
    await bot.send('/roll d20');
    const opts = bot.getLastReplyOptions();
    expect(opts.parse_mode).toEqual('HTML');
  });

  test('should include reply_parameters in group chats', async () => {
    await bot.send('/roll d20', 'group');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
    expect(opts.reply_parameters.message_id).toBeDefined();
  });

  test('should include reply_parameters in supergroup chats', async () => {
    await bot.send('/roll d20', 'supergroup');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should not include reply_parameters in channel chats', async () => {
    await bot.send('/roll d20', 'channel');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeUndefined();
  });

  test('should not include reply_parameters in private chats', async () => {
    await bot.send('/roll d20', 'private');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeUndefined();
  });

  test('should route @botname-suffixed commands', async () => {
    const pattern = /^<code>1d20<\/code> = <b>\d+<\/b>/;
    expect(await bot.send('/roll@testbot d20')).toMatch(pattern);
    expect(await bot.send('/full@testbot d20')).toMatch(pattern);
    expect(await bot.send('/random@testbot')).toMatch(/^<b>\d{1,3}<\/b>$/);
  });
});

describe('Chosen inline results', () => {
  let log: ReturnType<typeof spyOn<Console, 'log'>>;

  beforeEach(() => {
    log = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  async function chosenLog(resultId: string, query = ''): Promise<string> {
    await bot.sendChosenInline(resultId, query);
    return log.mock.calls.at(-1)?.[0] ?? '';
  }

  test('should log the chosen variant', async () => {
    expect(await chosenLog('roll:abc', 'd20')).toEqual('@testuser [inline] roll: d20');
    expect(await chosenLog('full:abc', 'd20')).toEqual('@testuser [inline] full: d20');
    expect(await chosenLog('random:abc')).toEqual('@testuser [inline] random: d100');
  });

  test('should log the default notation for an empty query', async () => {
    expect(await chosenLog('roll:abc')).toEqual('@testuser [inline] roll: d20');
  });

  test('should log an unknown variant for unprefixed ids', async () => {
    expect(await chosenLog('abc', 'd20')).toEqual('@testuser [inline] unknown: d20');
  });
});

describe('Analytics tracking', () => {
  let dataset: FakeDataset;
  let tracked: TestBot;
  let log: ReturnType<typeof spyOn<Console, 'log'>>;

  beforeEach(() => {
    dataset = new FakeDataset();
    tracked = new TestBot({ ANALYTICS: dataset, ANALYTICS_SALT: FAKE_SALT });
    log = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  test('should record the command, term and surface of a roll', async () => {
    await tracked.send('/roll 4d6kh3', 'supergroup');

    expect(dataset.points).toHaveLength(1);
    expect(dataset.points[0].indexes).toEqual(['d6']);
    expect(dataset.points[0].blobs?.slice(0, 4)).toEqual(['roll', '4d6', 'kh', 'supergroup']);
  });

  test('should record /full and /random under their own commands', async () => {
    await tracked.send('/full 2d10');
    expect(dataset.points.at(-1)?.blobs?.slice(0, 2)).toEqual(['full', '2d10']);

    await tracked.send('/random');
    expect(dataset.points.at(-1)?.blobs?.slice(0, 2)).toEqual(['random', '1d100']);
  });

  test('should record /start and /help with no dice term', async () => {
    await tracked.send('/start');
    expect(dataset.points.at(-1)?.indexes).toEqual(['start']);
    expect(dataset.points.at(-1)?.blobs?.slice(0, 3)).toEqual(['start', '', '']);

    await tracked.send('/help');
    expect(dataset.points.at(-1)?.indexes).toEqual(['help']);
  });

  test('should record chosen inline results on the inline surface', async () => {
    await tracked.sendChosenInline('roll:abc', '2d6');
    expect(dataset.points.at(-1)?.blobs?.slice(0, 4)).toEqual(['inline', '2d6', '', 'inline']);

    await tracked.sendChosenInline('random:abc');
    expect(dataset.points.at(-1)?.blobs?.[1]).toEqual('1d100');
  });

  test('should not record inline queries, which fire per keystroke', async () => {
    await tracked.sendInline('d20');

    expect(dataset.points).toHaveLength(0);
  });

  test('should reply normally when no binding is configured', async () => {
    expect(await bot.send('/roll d20')).toMatch(/^<code>1d20<\/code> = <b>\d+<\/b>/);
  });

  test('should reply normally when the dataset throws', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});
    const failing = new TestBot({ ANALYTICS: new ThrowingDataset(), ANALYTICS_SALT: FAKE_SALT });

    expect(await failing.send('/roll d20')).toMatch(/^<code>1d20<\/code> = <b>\d+<\/b>/);
    expect(await failing.send('/help')).not.toEqual('');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('should record nothing, and log nothing, for notation that did not parse', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});

    expect(await tracked.send('/roll not-notation')).toMatch(/^<i>.+<\/i>/);
    expect(dataset.points).toHaveLength(0);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('should record the preset a chosen inline result fell back to', async () => {
    await tracked.sendChosenInline('roll:abc', 'not-notation');
    expect(dataset.points.at(-1)?.blobs?.slice(0, 2)).toEqual(['inline', '1d20']);

    await tracked.sendChosenInline('full:abc', '');
    expect(dataset.points.at(-1)?.blobs?.slice(0, 2)).toEqual(['inline', '1d20']);
  });

  test('should record the term the user saw, not a fresh roll of a meta count', async () => {
    await tracked.send('/roll (1d4)d6');

    const terms = dataset.points.map((point) => point.blobs?.[1]);
    expect(terms).toHaveLength(1);
    expect(tracked.getLastReplyOptions().text).toContain(`<code>${terms[0]}</code>`);
  });
});

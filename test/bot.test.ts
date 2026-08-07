import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from './helpers';

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

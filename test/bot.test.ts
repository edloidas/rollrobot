import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from './helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Bot message options', () => {
  test('should reply with Markdown parse mode', async () => {
    await bot.send('/roll d20');
    const opts = bot.getLastReplyOptions();
    expect(opts.parse_mode).toEqual('Markdown');
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

  test('should include reply_parameters in channel chats', async () => {
    await bot.send('/roll d20', 'channel');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should not include reply_parameters in private chats', async () => {
    await bot.send('/roll d20', 'private');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeUndefined();
  });

  test('should route @botname-suffixed commands', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\*/;
    expect(await bot.send('/roll@testbot d20')).toMatch(pattern);
    expect(await bot.send('/full@testbot d20')).toMatch(/`\([\d+-dDf!>]+\)` \*\d+\* `\[/);
    expect(await bot.send('/random@testbot')).toMatch(/`\(d100\)` \*\d{1,3}\*/);
  });
});

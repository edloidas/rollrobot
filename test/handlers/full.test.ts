import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const pattern = /^<code>[^<]+<\/code> = <b>-?\d+<\/b>\n.+\[.+\]/;

describe('/full', () => {
  test('should explain invalid input with the error span', async () => {
    expect(await bot.send('/full a')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/full 6d')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/full 4d6d1')).toMatch(/<pre>4d6d1\n {3}\^/);
  });

  test('should parse and roll notation with a breakdown', async () => {
    expect(await bot.send('/full')).toMatch(pattern);
    expect(await bot.send('/full d20')).toMatch(pattern);
    expect(await bot.send('/full d8!')).toMatch(pattern);
    expect(await bot.send('/full 4d20-1')).toMatch(pattern);
    expect(await bot.send('/full 4d6kh3')).toMatch(pattern);
  });

  test('should mark dropped dice in the breakdown', async () => {
    const reply = await bot.send('/full 4d6kh3');
    expect(reply).toContain('<s>');
  });

  test('should work in group chats with reply', async () => {
    expect(await bot.send('/full d10', 'group')).toMatch(pattern);

    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should reject rolls above the dice limit', async () => {
    expect(await bot.send('/full 999d6')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/full 101d20')).toMatch(/^<i>.+<\/i>/);
  });

  test('should support the /f shortcut', async () => {
    expect(await bot.send('/f d20')).toMatch(pattern);
    expect(await bot.send('/f')).toMatch(pattern);
  });

  test('should keep legacy shorthand working', async () => {
    expect(await bot.send('/full 2 10 -1')).toMatch(pattern);
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { errorText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const pattern = /^`\([^`]+\)` \*-?\d+\* `\[-?\d+(?:,-?\d+)*\]`$/;

describe('/full', () => {
  test('should notify of invalid input', async () => {
    expect(await bot.send('/full a')).toEqual(errorText);
    expect(await bot.send('/full 6d')).toEqual(errorText);
    expect(await bot.send('/full 4d6d1')).toEqual(errorText);
  });

  test('should parse and roll notation with individual rolls', async () => {
    expect(await bot.send('/full')).toMatch(pattern);
    expect(await bot.send('/full d20')).toMatch(pattern);
    expect(await bot.send('/full d8!')).toMatch(pattern);
    expect(await bot.send('/full 4d20-1')).toMatch(pattern);
    expect(await bot.send('/full 4d6kh3')).toMatch(pattern);
    expect(await bot.send('/full 10d10>=6f1')).toMatch(pattern);
  });

  test('should work in group chats with reply', async () => {
    expect(await bot.send('/full d10', 'group')).toMatch(pattern);

    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should reject rolls above the dice limit', async () => {
    expect(await bot.send('/full 999d6')).toEqual(errorText);
    expect(await bot.send('/full 101d20')).toEqual(errorText);
  });
});

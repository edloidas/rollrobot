import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { errorText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/full', () => {
  test('should notify of invalid input', async () => {
    expect(await bot.send('/full a')).toEqual(errorText);
    expect(await bot.send('/full -7')).toEqual(errorText);
    expect(await bot.send('/full 6d')).toEqual(errorText);
  });

  test('should parse and roll notation with individual rolls', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    expect(await bot.send('/full')).toMatch(pattern);
    expect(await bot.send('/full 10')).toMatch(pattern);
    expect(await bot.send('/full d20')).toMatch(pattern);
    expect(await bot.send('/full d8!')).toMatch(pattern);
    expect(await bot.send('/full 4d20-1')).toMatch(pattern);
    expect(await bot.send('/full 3d10!>6f3')).toMatch(pattern);
  });

  test('should work in group chats with reply', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    expect(await bot.send('/full 10', 'group')).toMatch(pattern);

    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should limit roll values', async () => {
    const classicPattern = /`\(12d999999999(\+|-)999999999\)` \*\d+\*/;
    const wodPattern = /`\(12d999999999!>999999999f999999998\)` \*\d+\*/;

    expect(await bot.send('/full 100d1234567890+1234567890')).toMatch(classicPattern);
    expect(await bot.send('/full 77d7777777777-7777777777')).toMatch(classicPattern);
    expect(await bot.send('/full 999d1234567890!>7777777777f1111111111')).toMatch(wodPattern);
  });
});

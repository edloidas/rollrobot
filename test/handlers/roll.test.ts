import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { errorText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/roll', () => {
  test('should notify of invalid input', async () => {
    expect(await bot.send('/roll a')).toEqual(errorText);
    expect(await bot.send('/roll 6d')).toEqual(errorText);
    expect(await bot.send('/roll 4d6d1')).toEqual(errorText);
  });

  test('should parse and roll notation', async () => {
    const pattern = /^`\([^`]+\)` \*-?\d+\*$/;
    expect(await bot.send('/roll')).toMatch(pattern);
    expect(await bot.send('/roll d20')).toMatch(pattern);
    expect(await bot.send('/roll d8!')).toMatch(pattern);
    expect(await bot.send('/roll 4d20-1')).toMatch(pattern);
    expect(await bot.send('/roll 4d6kh3')).toMatch(pattern);
    expect(await bot.send('/roll 10d10>=6f1')).toMatch(pattern);
  });

  test('should reject rolls above the dice limit', async () => {
    expect(await bot.send('/roll 999d6')).toEqual(errorText);
    expect(await bot.send('/roll 101d20')).toEqual(errorText);
  });
});

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
    expect(await bot.send('/roll -7')).toEqual(errorText);
    expect(await bot.send('/roll 6d')).toEqual(errorText);
  });

  test('should parse and roll notation', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\*/;
    expect(await bot.send('/roll')).toMatch(pattern);
    expect(await bot.send('/roll 10')).toMatch(pattern);
    expect(await bot.send('/roll d20')).toMatch(pattern);
    expect(await bot.send('/roll d8!')).toMatch(pattern);
    expect(await bot.send('/roll 4d20-1')).toMatch(pattern);
    expect(await bot.send('/roll 3d10!>6f3')).toMatch(pattern);
  });

  test('should limit roll values', async () => {
    const classicPattern = /`\(12d999999999(\+|-)999999999\)` \*\d+\*/;
    const wodPattern = /`\(12d999999999!>999999999f999999998\)` \*\d+\*/;

    expect(await bot.send('/roll 100d1234567890+1234567890')).toMatch(classicPattern);
    expect(await bot.send('/roll 77d7777777777-7777777777')).toMatch(classicPattern);
    expect(await bot.send('/roll 999d1234567890!>7777777777f1111111111')).toMatch(wodPattern);
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { deprecatedText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Deprecated commands', () => {
  test('should reply with notice for /sroll', async () => {
    expect(await bot.send('/sroll')).toEqual(deprecatedText);
  });

  test('should reply with notice for /droll', async () => {
    expect(await bot.send('/droll')).toEqual(deprecatedText);
  });
});

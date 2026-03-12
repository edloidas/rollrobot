import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { helpText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Help commands', () => {
  test('should reply with help text for /start', async () => {
    expect(await bot.send('/start')).toEqual(helpText);
  });

  test('should reply with help text for /help', async () => {
    expect(await bot.send('/help')).toEqual(helpText);
  });
});

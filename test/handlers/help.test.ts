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

  test('should link the playground and the notation reference', () => {
    expect(helpText).toContain('https://roll-parser.edloidas.io/');
    expect(helpText).toContain('https://roll-parser.edloidas.io/reference');
  });

  test('should not mention the author or the license', () => {
    expect(helpText).not.toContain('@edloidas');
    expect(helpText).not.toContain('MIT');
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { roll } from 'roll-parser';
import { TestBot } from '../helpers';
import { helpText } from '../../src/text';
import { normalizeNotation } from '../../src/notation';

/** Guide examples, run through the command shim so `/roll 2 10 -1` is checked as `2d10-1`. */
function notationExamples(): string[] {
  return [...helpText.matchAll(/<code>(.+?)<\/code>/g)].map(([, example]) =>
    normalizeNotation(
      example
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/^\/\w+\s*/, ''),
    ),
  );
}

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

  test('should hide the playground and reference URLs behind link text', () => {
    expect(helpText).toContain('<a href="https://roll-parser.edloidas.io/">playground</a>');
    expect(helpText).toContain(
      '<a href="https://roll-parser.edloidas.io/reference">notation reference</a>',
    );
  });

  test('should not mention retired commands', () => {
    for (const command of ['/sroll', '/droll', '/wod']) {
      expect(helpText).not.toContain(command);
    }
  });

  test('should only show notation the parser accepts', () => {
    const examples = notationExamples();
    expect(examples.length).toBeGreaterThan(0);
    for (const notation of examples) {
      expect(() => roll(notation)).not.toThrow();
    }
  });

  test('should not mention the author or the license', () => {
    expect(helpText).not.toContain('@edloidas');
    expect(helpText).not.toContain('MIT');
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { roll } from 'roll-parser';
import { TestBot } from '../helpers';
import { messages, SUPPORTED_LOCALES } from '../../src/i18n';
import { normalizeNotation } from '../../src/notation';

/** Guide examples, run through the command shim so `/roll 2 10 -1` is checked as `2d10-1`. */
function notationExamples(help: string): string[] {
  return [...help.matchAll(/<code>(.+?)<\/code>/g)].map(([, example]) =>
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

const en = messages('en');

describe('Help commands', () => {
  test('should reply with help text for /start', async () => {
    expect(await bot.send('/start')).toEqual(en.help);
  });

  test('should reply with help text for /help', async () => {
    expect(await bot.send('/help')).toEqual(en.help);
  });

  test('should hide the playground and reference URLs behind link text', () => {
    expect(en.help).toContain('<a href="https://roll-parser.edloidas.io/">playground</a>');
    expect(en.help).toContain(
      '<a href="https://roll-parser.edloidas.io/reference">notation reference</a>',
    );
  });

  test('should not mention retired commands', () => {
    for (const command of ['/sroll', '/droll', '/wod']) {
      expect(en.help).not.toContain(command);
    }
  });

  // Every locale repeats the same examples, so a mangled one is a translation bug
  for (const locale of SUPPORTED_LOCALES) {
    test(`should only show notation the parser accepts in ${locale}`, () => {
      const examples = notationExamples(messages(locale).help);
      expect(examples.length).toBeGreaterThan(0);
      for (const notation of examples) {
        expect(() => roll(notation)).not.toThrow();
      }
    });
  }

  test('should not mention the author or the license', () => {
    expect(en.help).not.toContain('@edloidas');
    expect(en.help).not.toContain('MIT');
  });

  test('should reply in the language of the requesting user', async () => {
    expect(await bot.send('/help', 'private', 'ru')).toEqual(messages('ru').help);
    expect(await bot.send('/help', 'private', 'de')).toEqual(messages('de').help);
    expect(await bot.send('/help', 'private', 'pt-br')).toEqual(messages('pt').help);
  });

  test('should fall back to English for unsupported languages', async () => {
    expect(await bot.send('/help', 'private', 'ja')).toEqual(en.help);
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { roll } from 'roll-parser';
import { TestBot } from '../helpers';
import { messages, SUPPORTED_LOCALES } from '../../src/i18n';
import { extractLabel } from '../../src/label';
import { normalizeNotation } from '../../src/notation';
import { pickReply } from '../../src/handlers/pick';

/** Every `<code>` block in the guide, unescaped. */
function codeBlocks(help: string): string[] {
  return [...help.matchAll(/<code>(.+?)<\/code>/g)].map(([, example]) =>
    example.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
  );
}

/** The two commands whose argument is prose, not notation — checked on their own terms below. */
const PROSE_COMMANDS = /^\/(ask|pick)\b/;

/**
 * Guide examples, run through the same shims the commands apply — so `/roll 2 10 -1`
 * is checked as `2d10-1`, and a label example is checked with its quotes stripped.
 * A translation that mangles a quote leaves it in the notation and fails here.
 */
function notationExamples(help: string): string[] {
  return codeBlocks(help)
    .filter((example) => !PROSE_COMMANDS.test(example))
    .map((example) => normalizeNotation(extractLabel(example.replace(/^\/\w+\s*/, '')).notation));
}

/** Examples for one prose command, with the command itself stripped. */
function argumentsOf(help: string, command: string): string[] {
  return codeBlocks(help)
    .filter((example) => example.startsWith(`/${command}`))
    .map((example) => example.replace(new RegExp(`^/${command}\\s*`), ''));
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

    // A translator who drops a separator leaves an example that cannot pick anything
    test(`should only show pick examples that split in ${locale}`, () => {
      const examples = argumentsOf(messages(locale).help, 'pick');
      expect(examples.length).toBeGreaterThan(0);
      for (const options of examples) {
        expect(pickReply(options, locale).choice).not.toBeNull();
      }
    });

    // The mark is the whole reason the example reads as a question and not as an option list
    test(`should end every ask example with a question mark in ${locale}`, () => {
      const examples = argumentsOf(messages(locale).help, 'ask');
      expect(examples.length).toBeGreaterThan(0);
      for (const question of examples) {
        expect(question).toMatch(/[?؟]$/u);
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

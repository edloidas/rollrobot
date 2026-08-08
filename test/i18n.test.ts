import { describe, test, expect } from 'bun:test';
import {
  DEFAULT_LOCALE,
  type Locale,
  type Messages,
  messages,
  resolveLocale,
  SUPPORTED_LOCALES,
} from '../src/i18n';

/** Every user-visible string in a dictionary, for checks that apply to all of them. */
function allText(entry: Messages): string[] {
  return [
    ...Object.values(entry.inline),
    entry.help,
    entry.shortDescription,
    entry.description,
    ...entry.commands.map((command) => command.description),
  ];
}

describe('resolveLocale', () => {
  test('matches a supported two-letter code', () => {
    expect(resolveLocale('ru')).toBe('ru');
    expect(resolveLocale('uk')).toBe('uk');
    expect(resolveLocale('be')).toBe('be');
  });

  // Telegram sends IETF tags, but setMyCommands only accepts ISO 639-1
  test('drops the region subtag', () => {
    expect(resolveLocale('pt-br')).toBe('pt');
    expect(resolveLocale('es-419')).toBe('es');
    expect(resolveLocale('en-GB')).toBe('en');
    expect(resolveLocale('fa-IR')).toBe('fa');
    expect(resolveLocale('fa-AF')).toBe('fa');
  });

  test('is case-insensitive', () => {
    expect(resolveLocale('DE')).toBe('de');
    expect(resolveLocale('PT-BR')).toBe('pt');
  });

  test('falls back to English for unsupported and missing codes', () => {
    expect(resolveLocale('ja')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('ua')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

describe('messages', () => {
  test('covers every advertised locale', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'es', 'pt', 'de', 'ru', 'uk', 'be', 'fa']);
  });

  for (const locale of SUPPORTED_LOCALES) {
    describe(locale, () => {
      const entry = messages(locale as Locale);

      test('fills every message slot', () => {
        for (const title of Object.values(entry.inline)) {
          expect(title.length).toBeGreaterThan(0);
        }
        expect(entry.help.length).toBeGreaterThan(0);
        expect(entry.description.length).toBeGreaterThan(0);
        expect(entry.shortDescription.length).toBeGreaterThan(0);
      });

      test('lists the same commands as English', () => {
        expect(entry.commands.map((c) => c.command)).toEqual(['roll', 'full', 'random', 'help']);
        for (const { description } of entry.commands) {
          expect(description.length).toBeGreaterThan(0);
          expect(description.length).toBeLessThanOrEqual(256);
        }
      });

      // Direction comes from line structure, never from invisible overrides. ZWNJ and ZWJ
      // are orthography, not direction, so Persian keeps them.
      test('carries no bidi control characters', () => {
        for (const text of allText(entry)) {
          expect(text).not.toMatch(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u);
        }
      });

      // Telegram rejects overlong profile texts outright
      test('stays inside the Telegram length caps', () => {
        expect(entry.shortDescription.length).toBeLessThanOrEqual(120);
        expect(entry.description.length).toBeLessThanOrEqual(512);
      });

      test('keeps the notation examples and links intact', () => {
        for (const example of [
          '2d20+5',
          '4d6kh3',
          'd8!',
          '2d6r&lt;3',
          '4d6min2',
          '6d10&gt;=6f1',
          '4dF',
          '2d6+floor(1d4/2)',
        ]) {
          expect(entry.help).toContain(example);
        }
        expect(entry.help).toContain('href="https://roll-parser.edloidas.io/"');
        expect(entry.help).toContain('href="https://roll-parser.edloidas.io/reference"');
      });

      test('advertises only the current commands', () => {
        for (const command of ['/roll', '/full', '/random', '/help']) {
          expect(entry.help).toContain(command);
        }
        for (const retired of ['/sroll', '/droll', '/wod']) {
          expect(entry.help).not.toContain(retired);
        }
      });
    });
  }
});

// Persian is the only right-to-left dictionary, so these cover what no other one can hit
describe('fa', () => {
  const entry = messages('fa');

  // `@` strands at the far end of a mention the same way `/` does on a command, so a line
  // carrying either needs the Latin anchor
  const NOTATION_LINE = /\/(roll|full|random|help|r|f)\b|\d*d[\d%F]|@\w/;

  test('uses Persian letter forms rather than Arabic ones', () => {
    for (const text of allText(entry)) {
      expect(text).not.toMatch(/[يكةى]/u);
    }
  });

  // Notation examples have to stay copy-pasteable into a roll, and the parser is ASCII
  test('writes every numeral in ASCII', () => {
    for (const text of allText(entry)) {
      expect(text).not.toMatch(/[٠-٩۰-۹]/u);
    }
  });

  // A line takes its direction from the first strong character. Open one right-to-left and
  // the leading `/` detaches, so `/roll 2d20kh1+5` reaches the reader as `roll 2d20kh1+5/`.
  const directionalLines = [entry.help, entry.description]
    .flatMap((text) => text.split('\n'))
    .concat(entry.commands.map((command) => command.description))
    .map((line) => line.replace(/<[^>]+>/g, ''))
    .filter((line) => NOTATION_LINE.test(line));

  test('opens every notation line with a Latin character', () => {
    for (const line of directionalLines) {
      const strong = line.match(/\p{Script=Latin}|\p{Script=Arabic}/u);
      expect(strong?.[0]).toMatch(/\p{Script=Latin}/u);
    }
  });

  test('finds the notation lines it means to check', () => {
    expect(directionalLines.length).toBeGreaterThan(20);
  });

  // ! Guillemets carry no Bidi_Paired_Bracket_Type, so a pair split across an LTR run and
  //   an RTL one resolves to different levels and the closing mark renders mirrored.
  test('keeps a quoted example clear of the prose that explains it', () => {
    for (const line of entry.help.split('\n')) {
      if (!line.includes('«')) continue;
      expect(line.replace(/<[^>]+>/g, '')).toMatch(/^\S+[^»]*»$/u);
    }
  });
});

import { describe, test, expect } from 'bun:test';
import {
  DEFAULT_LOCALE,
  type Locale,
  messages,
  resolveLocale,
  SUPPORTED_LOCALES,
} from '../src/i18n';

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
    expect(SUPPORTED_LOCALES).toEqual(['en', 'es', 'pt', 'de', 'ru', 'uk', 'be']);
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

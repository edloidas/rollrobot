import { describe, expect, test } from 'bun:test';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../src/i18n';
import {
  DEFAULT_SITE_LOCALE,
  detectLocale,
  localeDir,
  LOCALE_NAMES,
  SITE_LOCALES,
} from '../../site/src/locales';

describe('locale metadata', () => {
  test('matches the bot locale list and order', () => {
    expect(SITE_LOCALES).toEqual(SUPPORTED_LOCALES);
  });

  test('names every locale natively', () => {
    expect(LOCALE_NAMES.ru).toBe('Русский');
    expect(LOCALE_NAMES.fa).toBe('فارسی');
    expect(Object.keys(LOCALE_NAMES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  test('marks only Persian as right-to-left', () => {
    expect(localeDir('fa')).toBe('rtl');
    expect(localeDir('en')).toBe('ltr');
  });

  test('agrees with the bot on the default locale', () => {
    expect(DEFAULT_SITE_LOCALE).toBe(DEFAULT_LOCALE);
  });
});

describe('detectLocale', () => {
  test('prefers a stored choice over the browser', () => {
    expect(detectLocale(['de-DE'], 'ru')).toBe('ru');
  });

  test('ignores a stored value that is not supported', () => {
    expect(detectLocale(['de-DE'], 'zz')).toBe('de');
  });

  test('drops the region subtag', () => {
    expect(detectLocale(['pt-BR'], null)).toBe('pt');
  });

  test('walks the preference list until one is supported', () => {
    expect(detectLocale(['ja', 'no', 'uk-UA'], null)).toBe('uk');
  });

  test('falls back to English', () => {
    expect(detectLocale(['ja'], null)).toBe('en');
    expect(detectLocale([], null)).toBe('en');
  });
});

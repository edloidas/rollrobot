import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../../src/i18n';
import { MANUALS, resolveManual } from '../../site/content';
import { MANUAL_SECTIONS } from '../../site/content/types';
import { en } from '../../site/content/en';

describe('MANUALS', () => {
  test('covers exactly the locales the bot supports', () => {
    expect(Object.keys(MANUALS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});

describe('resolveManual', () => {
  test('returns English unchanged for en', () => {
    const resolved = resolveManual('en');
    for (const section of MANUAL_SECTIONS) {
      expect(resolved[section]).toEqual(en[section]);
    }
  });

  test('fills every section for every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const manual = resolveManual(locale);
      for (const section of MANUAL_SECTIONS) {
        expect(manual[section]).toBeDefined();
      }
    }
  });

  test('falls back to English section-by-section', () => {
    const ru = resolveManual('ru');
    expect(ru.hero.tagline).not.toBe(en.hero.tagline);
    expect(ru.footer).toEqual(en.footer);
  });
});

describe('resolveManual fallback map', () => {
  test('reports nothing fallen back for English', () => {
    const { fallback } = resolveManual('en');
    for (const section of MANUAL_SECTIONS) {
      expect(fallback[section]).toBe(false);
    }
  });

  test('reports only the untranslated sections for a partial locale', () => {
    const { fallback } = resolveManual('ru');
    expect(fallback.hero).toBe(false);
    expect(fallback.footer).toBe(true);
  });

  test('reports every section fallen back for an untranslated locale', () => {
    const { fallback } = resolveManual('fa');
    for (const section of MANUAL_SECTIONS) {
      expect(fallback[section]).toBe(true);
    }
  });

  test('carries an entry for every section of every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { fallback } = resolveManual(locale);
      expect(Object.keys(fallback).sort()).toEqual([...MANUAL_SECTIONS].sort());
    }
  });
});

import { describe, expect, test } from 'bun:test';
import { canonicalHref, contentUrl, localeFromPath } from '../../site/src/routing';

describe('localeFromPath', () => {
  test('reads the leading segment', () => {
    expect(localeFromPath('/ru/')).toBe('ru');
    expect(localeFromPath('/fa/index.html')).toBe('fa');
  });

  test('rejects an unsupported or absent segment', () => {
    expect(localeFromPath('/')).toBeNull();
    expect(localeFromPath('/zz/')).toBeNull();
  });
});

describe('canonicalHref', () => {
  test('swaps the locale path and keeps the origin', () => {
    expect(canonicalHref('https://rollrobot.edloidas.io/en/', 'es')).toBe(
      'https://rollrobot.edloidas.io/es/',
    );
  });

  test('keeps the built origin rather than adopting the preview host', () => {
    expect(canonicalHref('https://rollrobot.edloidas.io/fa/', 'ru')).toStartWith(
      'https://rollrobot.edloidas.io/',
    );
  });

  test('degrades to a root-relative path when the link is not absolute', () => {
    expect(canonicalHref('/en/', 'fa')).toBe('/fa/');
  });
});

describe('contentUrl', () => {
  test('looks the locale up in the injected map', () => {
    expect(contentUrl({ ru: '/content/ru.abc123.json' }, 'ru')).toBe('/content/ru.abc123.json');
  });

  test('returns null for a locale the map does not carry', () => {
    expect(contentUrl({}, 'ru')).toBeNull();
  });
});

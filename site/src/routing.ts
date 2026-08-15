import type { Locale } from './locales';
import { LOCALE_NAMES } from './locales';

/** Reads the locale from a path like `/ru/` or `/fa/index.html`. */
export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split('/').filter(Boolean)[0] ?? '';
  // ! `Object.hasOwn`, not `in` — see the same guard in locales.ts.
  return Object.hasOwn(LOCALE_NAMES, segment) ? (segment as Locale) : null;
}

/**
 * Repoints a canonical URL at another locale, keeping everything but the path.
 *
 * The origin comes from the link the build wrote rather than from `location`, so
 * a page reviewed on `localhost` keeps declaring the production origin. A link
 * that is somehow not absolute degrades to the root-relative path.
 */
export function canonicalHref(current: string, locale: Locale): string {
  try {
    const url = new URL(current);
    url.pathname = `/${locale}/`;

    return url.href;
  } catch {
    return `/${locale}/`;
  }
}

/** Looks up a locale's hashed content URL in the map the build injected. */
export function contentUrl(map: Record<string, string>, locale: Locale): string | null {
  return Object.hasOwn(map, locale) ? map[locale] : null;
}

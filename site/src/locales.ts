// ! Type-only import, and it must stay that way. `src/i18n.ts` imports all eight
// ! bot dictionaries as values; this module is in the browser bundle, so a value
// ! import would ship every locale's Telegram help text to every visitor. The
// ! locale list is therefore redeclared below and asserted equal in locales.test.ts.
import type { Locale } from '../../src/i18n';

export type { Locale };

/** Fallback locale. Mirrors `DEFAULT_LOCALE` in `src/i18n.ts`; the test asserts it. */
export const DEFAULT_SITE_LOCALE: Locale = 'en';

/**
 * Where a visitor's chosen language is remembered. The root shim reads it and
 * the client entry writes it; a retyped literal on either side would silently
 * lose a returning visitor's language with no test failing.
 */
export const LOCALE_STORAGE_KEY = 'rollrobot-locale';

/**
 * Tab order. Kept identical to the bot's list so the page can never advertise a
 * language the bot does not answer in.
 */
export const SITE_LOCALES: readonly Locale[] = ['en', 'es', 'pt', 'de', 'ru', 'uk', 'be', 'fa'];

/** Native names for the wide tab bar. Never translated — a language names itself. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  ru: 'Русский',
  uk: 'Українська',
  be: 'Беларуская',
  fa: 'فارسی',
};

const RTL_LOCALES: readonly Locale[] = ['fa'];

export function localeDir(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

function asLocale(value: string | null | undefined): Locale | null {
  const base = value?.toLowerCase().split('-')[0] ?? '';
  // ! `Object.hasOwn`, not `in` — `in` walks the prototype, so a stored value of
  // ! `constructor` would resolve to a function. Same guard as src/i18n.ts.
  return Object.hasOwn(LOCALE_NAMES, base) ? (base as Locale) : null;
}

/**
 * Picks the locale for a visitor landing on `/`. An explicit past choice wins over
 * the browser's list; an unsupported stored value is ignored rather than trusted.
 */
export function detectLocale(preferred: readonly string[], stored?: string | null): Locale {
  const remembered = asLocale(stored);
  if (remembered != null) return remembered;

  for (const tag of preferred) {
    const match = asLocale(tag);
    if (match != null) return match;
  }

  return DEFAULT_SITE_LOCALE;
}

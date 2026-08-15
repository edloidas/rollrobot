import type { Locale } from '../../src/i18n';
import { en } from './en';
import { ru } from './ru';
import type { FallbackSections, LocalizedManual, PartialManual } from './types';
import { MANUAL_SECTIONS } from './types';

// ! Placeholder entries until each translation lands — an empty object is a
// ! complete fallback to English, which is the intended state, not a gap.
const EMPTY: PartialManual = {};

export const MANUALS: Record<Locale, PartialManual> = {
  en,
  es: EMPTY,
  pt: EMPTY,
  de: EMPTY,
  ru,
  uk: EMPTY,
  be: EMPTY,
  fa: EMPTY,
};

/**
 * Merges a locale over English one top-level section at a time. Sections are
 * whole units on purpose: a half-translated `commands` list would interleave two
 * languages inside one table, which reads worse than the English section intact.
 *
 * Which sections took English is recorded rather than discarded — see
 * {@link LocalizedManual}.
 */
export function resolveManual(locale: Locale): LocalizedManual {
  const partial = MANUALS[locale] ?? {};
  const resolved = {} as LocalizedManual;
  const fallback = {} as FallbackSections;

  for (const section of MANUAL_SECTIONS) {
    const own = partial[section];
    fallback[section] = own === undefined;

    // ! `any` is deliberate — key and value types correlate per section, which
    // ! TypeScript cannot express through a loop. Do not add a biome-ignore:
    // ! `noExplicitAny` is off here, and an unused suppression is a lint error.
    (resolved as any)[section] = own ?? en[section];
  }

  resolved.fallback = fallback;

  return resolved;
}

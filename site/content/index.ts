import type { Locale } from '../../src/i18n';
import { be } from './be';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fa } from './fa';
import { pt } from './pt';
import { ru } from './ru';
import type { FallbackSections, LocalizedManual, PartialManual } from './types';
import { MANUAL_SECTIONS } from './types';
import { uk } from './uk';

/**
 * Every locale the bot speaks, each one translated whole.
 *
 * Typed `PartialManual` rather than `Manual` so a locale added later can land one
 * section at a time — see {@link mergeOverEnglish}. Each entry is nonetheless a
 * complete `Manual` today, which `resolveManual`'s test asserts.
 */
export const MANUALS: Record<Locale, PartialManual> = {
  en,
  es,
  pt,
  de,
  ru,
  uk,
  be,
  fa,
};

/**
 * Merges a translation over English one top-level section at a time. Sections are
 * whole units on purpose: a half-translated `commands` list would interleave two
 * languages inside one table, which reads worse than the English section intact.
 *
 * Which sections took English is recorded rather than discarded — see
 * {@link LocalizedManual}.
 */
export function mergeOverEnglish(partial: PartialManual): LocalizedManual {
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

export function resolveManual(locale: Locale): LocalizedManual {
  return mergeOverEnglish(MANUALS[locale] ?? {});
}

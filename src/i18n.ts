import { be } from './locales/be';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import type { Messages } from './locales/types';
import { uk } from './locales/uk';

export type { Messages } from './locales/types';

export const DEFAULT_LOCALE = 'en';

const MESSAGES = { en, es, pt, de, ru, uk, be } satisfies Record<string, Messages>;

export type Locale = keyof typeof MESSAGES;

export const SUPPORTED_LOCALES = Object.keys(MESSAGES) as Locale[];

/**
 * Telegram sends an IETF tag on `User.language_code` (`pt-br`, `en-GB`), while
 * dictionaries are keyed by the two-letter code that `setMyCommands` accepts —
 * so the region subtag is dropped and unknown languages fall back to English.
 */
export function resolveLocale(languageCode?: string): Locale {
  const base = languageCode?.toLowerCase().split('-')[0] ?? '';
  return base in MESSAGES ? (base as Locale) : DEFAULT_LOCALE;
}

export function messages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale];
}

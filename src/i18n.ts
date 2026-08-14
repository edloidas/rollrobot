import { be } from './locales/be';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fa } from './locales/fa';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import type { Messages } from './locales/types';
import { uk } from './locales/uk';

export type { Messages } from './locales/types';

export const DEFAULT_LOCALE = 'en';

const MESSAGES = { en, es, pt, de, ru, uk, be, fa } satisfies Record<string, Messages>;

export type Locale = keyof typeof MESSAGES;

export const SUPPORTED_LOCALES = Object.keys(MESSAGES) as Locale[];

/**
 * Telegram sends an IETF tag on `User.language_code` (`pt-br`, `en-GB`), while
 * dictionaries are keyed by the two-letter code that `setMyCommands` accepts —
 * so the region subtag is dropped and unknown languages fall back to English.
 */
export function resolveLocale(languageCode?: string): Locale {
  const base = languageCode?.toLowerCase().split('-')[0] ?? '';
  // ! `Object.hasOwn`, not `in` — `in` walks the prototype, so a client sending
  //   `language_code: "constructor"` would resolve to a function and throw on every lookup
  return Object.hasOwn(MESSAGES, base) ? (base as Locale) : DEFAULT_LOCALE;
}

export function messages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale];
}

/**
 * Commands whose behaviour is still settling. Marked at render rather than inside each
 * dictionary, so graduating one out of beta is a single edit here instead of eight
 * translations and the tests that assert on them.
 */
const BETA_COMMANDS: readonly string[] = ['pick'];
const BETA = '(beta)';

/** Suffixed: an inline title is a bare noun with nothing after it to be mistaken for. */
export function betaTitle(title: string, command: string): string {
  return BETA_COMMANDS.includes(command) ? `${title} ${BETA}` : title;
}

/**
 * Prefixed: a command description ends with its own example, so appending would publish
 * `… /pick Rock | Paper | Scissors (beta)` and read as though Scissors were the beta part.
 */
export function betaDescription(description: string, command: string): string {
  return BETA_COMMANDS.includes(command) ? `${BETA} ${description}` : description;
}

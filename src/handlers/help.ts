import { DEFAULT_LOCALE, type Locale, messages } from '../i18n';

export function helpReply(locale: Locale = DEFAULT_LOCALE): string {
  return messages(locale).help;
}

import { detectLocale, LOCALE_STORAGE_KEY } from './locales';

/**
 * Reads the remembered locale, tolerating a browser that refuses storage.
 * A throw here would strand the visitor on a blank `/` instead of redirecting.
 */
function storedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

const preferred = navigator.languages ?? [navigator.language];

location.replace(`/${detectLocale(preferred, storedLocale())}/`);

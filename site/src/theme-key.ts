/**
 * The stored theme's key, its modes, and the order the toggle cycles them.
 *
 * Split out of `theme.ts` so it can be imported where the DOM lib is absent —
 * that module touches `document`, `localStorage` and `window`, and the root
 * project deliberately has no DOM lib, so neither `check-site.ts` nor any test
 * can reach it. Key, values and cycle order match roll-parser's site, which
 * shares the domain but not the (per-origin) store.
 */

export type ThemeMode = 'auto' | 'light' | 'dark';

export const THEME_KEY = 'theme-preference';

export const THEME_CYCLE: ThemeMode[] = ['auto', 'light', 'dark'];

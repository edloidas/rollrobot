/**
 * Theme controller for the landing page.
 *
 * The preference (`auto` | `light` | `dark`) lives in the `theme-preference`
 * localStorage key and is mirrored onto `<html data-theme>`; `style.css`
 * resolves `auto` via `prefers-color-scheme`. Key, values and cycle order match
 * roll-parser's site, which shares the domain but not the (per-origin) store.
 *
 * A pre-paint inline script in `index.template.html` sets `data-theme` first to
 * avoid a flash; this module re-applies it (idempotent), wires the toggle, and
 * keeps other open tabs in sync.
 */

import { THEME_CYCLE as CYCLE, THEME_KEY, type ThemeMode } from './theme-key';

export type { ThemeMode };

/** Anything that is not one of the three modes — stale, hand-edited — reads as `auto`. */
function asTheme(value: string | null | undefined): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}

/**
 * Reads the stored mode, tolerating a browser that refuses storage. A throw
 * would abort the whole client entry, language tabs included.
 */
function getStoredTheme(): ThemeMode {
  try {
    return asTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return 'auto';
  }
}

function storeTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Storage refused — the preference lasts for this page only.
  }
}

/**
 * The mode currently on screen — what the toggle advances from, never the
 * stored mode. A browser that refuses storage answers every read with `auto`,
 * so cycling from storage would return `light` on every click.
 */
function appliedTheme(): ThemeMode {
  return asTheme(document.documentElement.dataset.theme);
}

/** `data-label-auto` and friends, as `dataset` spells them. */
const LABEL_KEYS: Record<ThemeMode, string> = {
  auto: 'labelAuto',
  light: 'labelLight',
  dark: 'labelDark',
};

/**
 * Names the applied mode on the button, which carries an icon and no text.
 *
 * Looks the element up per call rather than closing over it: a locale switch
 * rewrites these attributes in place, and the label has to follow the mode
 * whether the mode or the language is what changed.
 */
function labelToggle(mode: ThemeMode): void {
  const toggle = document.getElementById('theme-toggle');
  const label = toggle?.dataset[LABEL_KEYS[mode]];

  if (toggle != null && label != null) toggle.setAttribute('aria-label', label);
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  labelToggle(mode);
}

/** Re-labels the toggle after a locale switch replaced its three mode labels. */
export function relabelTheme(): void {
  labelToggle(appliedTheme());
}

function nextTheme(mode: ThemeMode): ThemeMode {
  const index = CYCLE.indexOf(mode);
  return CYCLE[(index + 1) % CYCLE.length];
}

/**
 * Applies the stored theme, wires `#theme-toggle` to cycle auto → light → dark,
 * and mirrors changes made in another tab via the `storage` event.
 *
 * Revealing the toggle is part of the wiring: this is the only point at which
 * the control is known to work, so a visitor whose bundle never arrived is never
 * shown a button that cannot respond. See `.theme-nav` in `style.css`.
 */
export function initTheme(): void {
  applyTheme(getStoredTheme());

  const toggle = document.getElementById('theme-toggle');

  if (toggle !== null) {
    toggle.addEventListener('click', () => {
      const next = nextTheme(appliedTheme());
      storeTheme(next);
      applyTheme(next);
    });

    document.documentElement.dataset.themeToggle = 'ready';
  }

  window.addEventListener('storage', (event) => {
    if (event.key === THEME_KEY) applyTheme(getStoredTheme());
  });

  // bfcache restores a frozen page without re-running scripts, so a theme
  // changed elsewhere would otherwise stay stale until a reload.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) applyTheme(getStoredTheme());
  });
}

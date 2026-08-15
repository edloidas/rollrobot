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

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
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

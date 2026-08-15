import type { Locale } from './locales';
import { localeDir, LOCALE_STORAGE_KEY } from './locales';
import { renderHero, renderManual } from './render';
// ! `import type`, never a value import — see the same guard in render.ts.
// ! `replies.ts` pulls in roll-parser and must never reach the browser bundle.
import type { ResolvedManual } from './replies';
import { canonicalHref, contentUrl, localeFromPath } from './routing';
import { initTheme } from './theme';

//
// * State
//

let currentLocale: Locale = document.documentElement.lang as Locale;

const contentUrls = readContentUrls();

// ! Bumped per switchLocale call so a response that resolves after a newer one
// ! (rapid clicks) is discarded instead of leaving the URL and the visible
// ! content disagreeing.
let switchGeneration = 0;

//
// * Persistent elements
//

// None of the three sit inside `header.hero` or `main.manual`, the only two
// subtrees applyLocale replaces, so all three survive every switch and are
// worth finding once rather than on each click.
const tabsEl = document.querySelector('.tabs');
const canonicalEl = document.querySelector('link[rel="canonical"]');
const descriptionEl = document.querySelector('meta[name="description"]');

//
// * Content lookup
//

function readContentUrls(): Record<string, string> {
  const script = document.getElementById('content-urls');
  if (script?.textContent == null) return {};

  try {
    return JSON.parse(script.textContent) as Record<string, string>;
  } catch {
    return {};
  }
}

//
// * Switching
//

/**
 * Fetches the target locale's content and swaps the manual in place. Any failure
 * falls back to a normal navigation rather than leaving the page half-switched.
 *
 * `deliberate` marks a user-initiated switch (tab click) as against a history
 * traversal (`popstate`): only the former pushes a history entry and persists
 * the choice — see {@link applyLocale}.
 */
async function switchLocale(locale: Locale, options: { deliberate: boolean }): Promise<void> {
  const url = contentUrl(contentUrls, locale);
  const generation = ++switchGeneration;

  if (url === null) {
    navigate(locale, options);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected status ${response.status}`);

    const manual = (await response.json()) as ResolvedManual;
    // ! Lost the race to a later switch — must not overwrite what is on screen.
    if (generation !== switchGeneration) return;

    applyLocale(locale, manual, options);
    currentLocale = locale;
  } catch {
    if (generation !== switchGeneration) return;
    navigate(locale, options);
  }
}

/**
 * Falls back to a full page load, saving the choice first when the switch was
 * deliberate.
 *
 * The save cannot be left to the page this navigation loads — that page reads
 * its locale from the URL and never writes one back, so a visitor who picks a
 * language on a broken content fetch would keep it for this visit only.
 */
function navigate(locale: Locale, options: { deliberate: boolean }): void {
  if (options.deliberate) rememberLocale(locale);

  location.assign(`/${locale}/`);
}

/** Saves the visitor's choice, tolerating a browser that refuses storage. */
function rememberLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage refused — switching still works, it just is not remembered.
  }
}

function applyLocale(
  locale: Locale,
  manual: ResolvedManual,
  options: { deliberate: boolean },
): void {
  const heroEl = document.querySelector('header.hero');
  if (heroEl !== null) heroEl.outerHTML = renderHero(manual, locale);

  const mainEl = document.querySelector('main.manual');
  if (mainEl !== null) mainEl.outerHTML = renderManual(manual, locale);

  document.title = manual.meta.title;
  descriptionEl?.setAttribute('content', manual.meta.description);

  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);

  // The reciprocal `hreflang` links are the same set on every page and stay put.
  // Only the canonical names *this* document, so it has to follow the switch.
  updateCanonical(locale);

  activateTab(locale);

  // ! Only a deliberate switch counts as the visitor's choice. A `popstate`
  // ! traversal must not overwrite it, or pressing back a few times silently
  // ! rewrites the saved preference to wherever history landed.
  if (options.deliberate) {
    rememberLocale(locale);
    history.pushState({ locale }, '', `/${locale}/`);
  }
}

/** Repoints `<link rel="canonical">` at the locale now on screen. */
function updateCanonical(locale: Locale): void {
  const current = canonicalEl?.getAttribute('href');
  if (canonicalEl === null || current == null) return;

  canonicalEl.setAttribute('href', canonicalHref(current, locale));
}

/** Moves `aria-current` to the matching tab and scrolls it into view horizontally. */
function activateTab(locale: Locale): void {
  if (tabsEl === null) return;

  for (const tab of tabsEl.querySelectorAll('.tab')) {
    if (tab.getAttribute('data-locale') === locale) {
      tab.setAttribute('aria-current', 'page');
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      tab.removeAttribute('aria-current');
    }
  }
}

//
// * Event wiring
//

function onTabsClick(event: MouseEvent): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest('a.tab');
  if (anchor === null) return;

  const href = anchor.getAttribute('href');
  const locale = href === null ? null : localeFromPath(href);
  if (locale === null) return;

  // ! Prevent default before the same-locale return, not after: the anchor's
  // ! href is a real page, so an unprevented click on the active tab still
  // ! navigates and discards scroll position and state.
  event.preventDefault();
  if (locale === currentLocale) return;

  void switchLocale(locale, { deliberate: true });
}

function onPopState(): void {
  const locale = localeFromPath(location.pathname);
  if (locale === null) return;

  void switchLocale(locale, { deliberate: false });
}

tabsEl?.addEventListener('click', onTabsClick);
window.addEventListener('popstate', onPopState);

initTheme();

/**
 * Verifies `site/dist/` before it is published, naming the exact file and
 * problem it found.
 *
 * Constants come from `site-manifest.ts` and locale data from
 * `site/src/locales.ts` — the same modules `build-site.ts` writes from — so this
 * checker cannot drift from what the build produces.
 */

import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import type { Locale } from '../site/src/locales';
import { localeDir, SITE_LOCALES } from '../site/src/locales';
import { THEME_KEY } from '../site/src/theme-key';
import {
  ASSETS_DIR_NAME,
  CONTENT_DIR_NAME,
  DIST_DIR,
  escapeRegExp,
  FAVICON,
  FONTS_DIR_NAME,
  ROOT_DIR,
  SCRIPT_ENTRYPOINT,
  SITE_ORIGIN,
} from './site-manifest';

/**
 * The client bundle's byte ceiling, sized to catch `roll-parser` leaking in
 * through a value import where a type-only one was required.
 *
 * The bundle sits at 5,743 bytes and does not grow with manual content, which is
 * fetched as JSON at runtime. A leak would land near 16-17 kB (roll-parser's own
 * budgets are 12.75 kB for `{ roll }`, 12.85 kB for the full index), so 8 kB
 * gives ~1.8x headroom over the real size while still catching it.
 */
const BUNDLE_MAX_BYTES = 8 * 1024;
const LEAK_MARKER = 'MockRNGExhausted';

const problems: string[] = [];

function report(message: string): void {
  problems.push(message);
}

function toRel(path: string): string {
  return relative(ROOT_DIR, path);
}

/**
 * Root-relative paths a page or stylesheet may point at, minus the
 * scheme-qualified ones. Built from the manifest's directory names rather than
 * retyped literals: a pattern that compiles but matches nothing reads as
 * "nothing to check" and passes.
 */
const ASSET_REF_PATTERN = new RegExp(
  `(?:href|src)="(\\/(?:${escapeRegExp(ASSETS_DIR_NAME)}|${escapeRegExp(FONTS_DIR_NAME)}|` +
    `${escapeRegExp(CONTENT_DIR_NAME)})\\/[^"]+|\\/${escapeRegExp(FAVICON)})"`,
  'g',
);

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    report(`${toRel(DIST_DIR)} does not exist — run \`bun run site:build\` first`);
    finish();
    return;
  }

  await checkRootShim();
  await checkBundle();
  await checkStylesheetFonts();

  for (const locale of SITE_LOCALES) {
    await checkLocalePage(locale);
  }

  finish();
}

//
// * Root shim
//

async function checkRootShim(): Promise<void> {
  const path = join(DIST_DIR, 'index.html');

  if (!existsSync(path)) {
    report(`root shim missing: ${toRel(path)}`);
    return;
  }

  const html = await Bun.file(path).text();
  if (!html.includes('location.replace')) {
    report(`${toRel(path)}: does not call "location.replace" — the root shim is inert`);
  }
}

//
// * Client bundle
//

async function checkBundle(): Promise<void> {
  const assetsDir = join(DIST_DIR, ASSETS_DIR_NAME);

  if (!existsSync(assetsDir)) {
    report(`assets directory missing: ${toRel(assetsDir)}`);
    return;
  }

  const baseName = SCRIPT_ENTRYPOINT.slice(0, -extname(SCRIPT_ENTRYPOINT).length);
  const bundlePattern = new RegExp(`^${escapeRegExp(baseName)}\\.[^.]+\\.js$`);
  const entries = await readdir(assetsDir);
  const bundleName = entries.find((entry) => bundlePattern.test(entry));

  if (bundleName === undefined) {
    report(`no client bundle matching "${baseName}.<hash>.js" found in ${toRel(assetsDir)}`);
    return;
  }

  const bundlePath = join(assetsDir, bundleName);
  const bundleFile = Bun.file(bundlePath);
  const size = bundleFile.size;

  if (size > BUNDLE_MAX_BYTES) {
    report(
      `${toRel(bundlePath)} is ${size} bytes, over the ${BUNDLE_MAX_BYTES}-byte client bundle ` +
        'ceiling — likely roll-parser leaking into the browser bundle',
    );
  }

  const code = await bundleFile.text();
  if (code.includes(LEAK_MARKER)) {
    report(
      `${toRel(bundlePath)} contains "${LEAK_MARKER}" — roll-parser leaked into the client ` +
        'bundle through a value import',
    );
  }
}

/**
 * Fonts are reachable only through the stylesheet's `url(...)` rules, never from
 * an HTML `href`/`src`, so they need a pass of their own.
 */
async function checkStylesheetFonts(): Promise<void> {
  const assetsDir = join(DIST_DIR, ASSETS_DIR_NAME);
  if (!existsSync(assetsDir)) return;

  const entries = await readdir(assetsDir);

  for (const entry of entries.filter((name) => name.endsWith('.css'))) {
    const cssPath = join(assetsDir, entry);
    const css = await Bun.file(cssPath).text();

    for (const [, url] of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        continue;
      }

      const onDisk = join(dirname(cssPath), url);
      if (!existsSync(onDisk)) {
        report(`${toRel(cssPath)}: references "${url}", missing at ${toRel(onDisk)}`);
      }
    }
  }
}

//
// * Locale pages
//

async function checkLocalePage(locale: Locale): Promise<void> {
  const dir = join(DIST_DIR, locale);
  const path = join(dir, 'index.html');

  if (!existsSync(dir)) {
    report(`locale "${locale}": directory missing at ${toRel(dir)}`);
    return;
  }

  if (!existsSync(path)) {
    report(`locale "${locale}": index.html missing at ${toRel(path)}`);
    return;
  }

  const html = await Bun.file(path).text();
  const rel = toRel(path);

  checkHtmlAttrs(locale, html, rel);
  checkThemePrepaint(html, rel);
  checkHreflang(html, rel);
  checkTemplateSlots(html, rel);
  checkDevPaths(html, rel);
  checkReferencedAssets(html, rel);
  checkContentUrls(html, rel);
}

function checkHtmlAttrs(locale: Locale, html: string, rel: string): void {
  const tag = html.match(/<html\s+([^>]*)>/i);

  if (tag === null) {
    report(`${rel}: no <html> tag found`);
    return;
  }

  const attrs = tag[1];
  const lang = attrs.match(/\blang="([^"]*)"/)?.[1];
  const dir = attrs.match(/\bdir="([^"]*)"/)?.[1];

  if (lang !== locale) {
    report(`${rel}: <html lang="${lang ?? ''}"> does not match its "${locale}" directory`);
  }

  const expectedDir = localeDir(locale);
  if (dir !== expectedDir) {
    report(`${rel}: <html dir="${dir ?? ''}"> should be "${expectedDir}" for locale "${locale}"`);
  }
}

/**
 * The pre-paint script must run before the stylesheet, or a light-mode visitor
 * gets a dark frame first. Nothing else fails when it goes missing — the page
 * still themes itself, one paint too late — so it is asserted here.
 */
function checkThemePrepaint(html: string, rel: string): void {
  const stylesheet = html.indexOf('<link rel="stylesheet"');

  if (stylesheet === -1) {
    report(`${rel}: no stylesheet link`);
    return;
  }

  if (!html.slice(0, stylesheet).includes(`localStorage.getItem('${THEME_KEY}')`)) {
    report(
      `${rel}: no pre-paint script reading "${THEME_KEY}" before the stylesheet — ` +
        'the page would flash the wrong theme',
    );
  }
}

/**
 * Pairs each `hreflang` with the `href` that locale should carry, not just with
 * its own presence — a set of `hreflang` values alone would pass nine reciprocal
 * links that all point at the same URL.
 */
function checkHreflang(html: string, rel: string): void {
  const links = new Map<string, string>(
    [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(
      ([, hreflang, href]) => [hreflang, href],
    ),
  );

  for (const locale of SITE_LOCALES) {
    checkHreflangTarget(links, locale, `${SITE_ORIGIN}/${locale}/`, rel);
  }

  checkHreflangTarget(links, 'x-default', `${SITE_ORIGIN}/`, rel);
}

function checkHreflangTarget(
  links: Map<string, string>,
  hreflang: string,
  expected: string,
  rel: string,
): void {
  const href = links.get(hreflang);

  if (href === undefined) {
    report(`${rel}: missing hreflang link for "${hreflang}"`);
  } else if (href !== expected) {
    report(`${rel}: hreflang="${hreflang}" points at "${href}", expected "${expected}"`);
  }
}

function checkTemplateSlots(html: string, rel: string): void {
  if (html.includes('{{')) report(`${rel}: contains an unfilled template slot ("{{")`);
}

function checkDevPaths(html: string, rel: string): void {
  if (html.includes('../public/'))
    report(`${rel}: contains an unrewritten dev path ("../public/")`);
}

function checkReferencedAssets(html: string, rel: string): void {
  for (const [, value] of html.matchAll(ASSET_REF_PATTERN)) {
    const onDisk = join(DIST_DIR, value);
    if (!existsSync(onDisk)) {
      report(`${rel}: references "${value}", missing at ${toRel(onDisk)}`);
    }
  }
}

function checkContentUrls(html: string, rel: string): void {
  const match = html.match(/<script type="application\/json" id="content-urls">([^<]*)<\/script>/);

  if (match === null) {
    report(`${rel}: missing "content-urls" script block`);
    return;
  }

  let urls: Record<string, unknown>;
  try {
    urls = JSON.parse(match[1]);
  } catch {
    report(`${rel}: "content-urls" script block is not valid JSON`);
    return;
  }

  for (const locale of SITE_LOCALES) {
    const url = urls[locale];

    if (typeof url !== 'string') {
      report(`${rel}: "content-urls" is missing an entry for "${locale}"`);
      continue;
    }

    const onDisk = join(DIST_DIR, url);
    if (!existsSync(onDisk)) {
      report(`${rel}: content URL for "${locale}" ("${url}") missing at ${toRel(onDisk)}`);
    }
  }
}

//
// * Helpers
//

function finish(): void {
  if (problems.length > 0) {
    console.error(`site check failed with ${problems.length} problem(s):\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log('Site check passed.');
}

await main();

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
  THEME_COLORS,
} from './site-manifest';

/**
 * The client bundle's byte ceiling, sized to catch `roll-parser` leaking in
 * through a value import where a type-only one was required.
 *
 * The bundle sits at ~7.3 kB and does not grow with manual content, which is
 * fetched as JSON at runtime. A leak would land near 20 kB (roll-parser's own
 * budgets are 12.75 kB for `{ roll }`, 12.85 kB for the full index), so 12 kB
 * still catches one outright while leaving the bundle room to gain a feature.
 *
 * ! Raise this only against a measured size. It was 8 kB when the bundle was
 * ! 7.5 kB, which is a ceiling that fails the next time anyone touches main.ts —
 * ! and a ceiling raised in a hurry is one nobody trusts.
 */
const BUNDLE_MAX_BYTES = 12 * 1024;
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
    `${escapeRegExp(CONTENT_DIR_NAME)})\\/[^"]+|\\/${escapeRegExp(FAVICON)}|` +
    `\\/favicon-\\d+\\.png)"`,
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
  await checkHeaders();
  await checkThemeColors();
  await checkRobots();
  await checkSitemap();

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
  const rel = toRel(path);

  if (!html.includes('location.replace')) {
    report(`${rel}: does not call "location.replace" — the root shim is inert`);
  }

  // The shim ships no stylesheet, so without a declared scheme a dark-mode
  // visitor gets a white frame for the length of the redirect.
  if (!html.includes('color-scheme')) {
    report(`${rel}: declares no "color-scheme" — dark-mode visitors flash white`);
  }

  // `/` is the x-default target, so a preview fetcher that does not run the
  // redirect still has to find a card here.
  checkSocial(html, rel, `${SITE_ORIGIN}/`);
  checkReferencedAssets(html, rel);
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
// * Site files
//

/**
 * `<base>.<hash>.<ext>`, the shape `build-site.ts` writes cache-busted names in.
 *
 * Alphanumeric rather than hex: `contentHash` emits hex, but Bun's own `[hash]`
 * slot names the client bundle in base 36 (`main.r0382x5m.js`), and both are
 * cache-busted.
 */
const HASHED_NAME = /\.[0-9a-z]{8}\.[^.]+$/;

/**
 * Asserts `_headers` exists and — the part that matters — that every directory
 * it serves `immutable` holds nothing but content-hashed filenames.
 *
 * A year-long `immutable` on a verbatim filename is unbustable: re-cut the file
 * and every prior visitor keeps the stale copy until the header expires. The
 * fonts shipped verbatim before this check existed.
 */
async function checkHeaders(): Promise<void> {
  const path = join(DIST_DIR, '_headers');

  if (!existsSync(path)) {
    report(`Cloudflare Pages headers file missing: ${toRel(path)}`);
    return;
  }

  const text = await Bun.file(path).text();

  for (const dir of [ASSETS_DIR_NAME, FONTS_DIR_NAME, CONTENT_DIR_NAME]) {
    if (!text.includes(`/${dir}/*`)) {
      report(`${toRel(path)}: no rule for "/${dir}/*"`);
      continue;
    }

    if (!immutableFor(text, dir)) continue;

    const onDisk = join(DIST_DIR, dir);
    if (!existsSync(onDisk)) continue;

    const unhashed = (await readdir(onDisk)).filter((entry) => !HASHED_NAME.test(entry));

    if (unhashed.length > 0) {
      report(
        `${toRel(path)}: serves "/${dir}/*" immutable, but ${unhashed.length} file(s) there ` +
          `carry no content hash and could never be busted: ${unhashed.join(', ')}`,
      );
    }
  }
}

/** Whether the block for `/<dir>/*` carries `immutable`, and not some later block. */
function immutableFor(headers: string, dir: string): boolean {
  const block = headers.split(/^(?=\/)/m).find((part) => part.startsWith(`/${dir}/*`));

  return block !== undefined && block.includes('immutable');
}

/**
 * Asserts both `theme-color` values still name a colour the stylesheet uses.
 *
 * The tags are written from `THEME_COLORS` and the palette from `style.css`, so
 * nothing but this ties the browser chrome to the page it frames — retune `--bg`
 * in either palette and the tag would keep painting the old one.
 */
async function checkThemeColors(): Promise<void> {
  const assetsDir = join(DIST_DIR, ASSETS_DIR_NAME);
  if (!existsSync(assetsDir)) return;

  const sheets = (await readdir(assetsDir)).filter((name) => name.endsWith('.css'));

  for (const entry of sheets) {
    const cssPath = join(assetsDir, entry);
    const css = await Bun.file(cssPath).text();

    for (const colour of THEME_COLORS) {
      if (!css.includes(colour)) {
        report(
          `${toRel(cssPath)}: theme-color "${colour}" appears nowhere in the stylesheet — ` +
            'THEME_COLORS has drifted from the palette',
        );
      }
    }
  }
}

/**
 * Link-preview tags. A card that quietly stops rendering is invisible from the
 * page itself, so the `og:url`/`og:image` pair is asserted rather than trusted.
 */
function checkSocial(html: string, rel: string, url: string): void {
  const content = (property: string): string | undefined =>
    html.match(
      new RegExp(`<meta (?:property|name)="${escapeRegExp(property)}" content="([^"]*)"`),
    )?.[1];

  for (const tag of ['og:type', 'og:title', 'og:description', 'twitter:card']) {
    if (content(tag) === undefined) report(`${rel}: missing "${tag}"`);
  }

  const declared = content('og:url');
  if (declared !== url) {
    report(`${rel}: og:url is "${declared ?? ''}", expected "${url}"`);
  }

  const image = content('og:image');
  if (image === undefined) {
    report(`${rel}: missing "og:image"`);
    return;
  }

  if (!image.startsWith(SITE_ORIGIN)) {
    report(`${rel}: og:image "${image}" is not absolute — preview fetchers require a full URL`);
    return;
  }

  const onDisk = join(DIST_DIR, image.slice(SITE_ORIGIN.length));
  if (!existsSync(onDisk)) {
    report(`${rel}: og:image "${image}" missing at ${toRel(onDisk)}`);
  }
}

async function checkRobots(): Promise<void> {
  const path = join(DIST_DIR, 'robots.txt');

  if (!existsSync(path)) {
    report(`robots.txt missing: ${toRel(path)}`);
    return;
  }

  const text = await Bun.file(path).text();
  const sitemap = `${SITE_ORIGIN}/sitemap.xml`;

  if (!text.includes(sitemap)) {
    report(`${toRel(path)}: does not point at "${sitemap}"`);
  }
}

async function checkSitemap(): Promise<void> {
  const path = join(DIST_DIR, 'sitemap.xml');

  if (!existsSync(path)) {
    report(`sitemap.xml missing: ${toRel(path)}`);
    return;
  }

  const xml = await Bun.file(path).text();

  for (const locale of SITE_LOCALES) {
    const loc = `<loc>${SITE_ORIGIN}/${locale}/</loc>`;
    if (!xml.includes(loc)) report(`${toRel(path)}: missing "${loc}"`);
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
  checkSocial(html, rel, `${SITE_ORIGIN}/${locale}/`);
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

/**
 * Builds the static landing page into `site/dist/`.
 *
 * Emits one prerendered page per locale plus a root shim that redirects `/` to
 * the visitor's language. Example bot replies are generated here, at build time,
 * so `roll-parser` never enters the browser bundle. Exits non-zero on failure.
 */

import { readdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { resolveManual } from '../site/content';
import type { Locale } from '../site/src/locales';
import { LOCALE_NAMES, localeDir, SITE_LOCALES } from '../site/src/locales';
import type { ResolvedManual } from '../site/src/replies';
import { resolveExamples } from '../site/src/replies';
import { escapeHtml, renderHero, renderManual, renderTabs } from '../site/src/render';
import {
  ASSETS_DIR_NAME,
  contentHash,
  CONTENT_DIR_NAME,
  CSS_FONT_PATH,
  DIST_DIR,
  escapeRegExp,
  FAVICON,
  FONTS_DIR_NAME,
  PUBLIC_DIR,
  REDIRECT_ENTRYPOINT,
  SCRIPT_ENTRYPOINT,
  SITE_DIR,
  SITE_ORIGIN,
  SRC_DIR,
  STYLE_SOURCE,
  TEMPLATE_SOURCE,
} from './site-manifest';

/** A locale's resolved manual paired with the URL its JSON was written to. */
type Page = { manual: ResolvedManual; contentUrl: string };

/** The emitted stylesheet's URL, plus its text — the font check reads the text. */
type Stylesheet = { url: string; css: string };

async function build(): Promise<void> {
  await rm(DIST_DIR, { recursive: true, force: true });

  const script = await bundleClient();
  const style = await copyStyle();

  await copyFonts(style.css);
  await copyFavicon();

  const pages = await writeContent();
  await writePages(pages, { script, style: style.url });
  await writeRedirectShim();

  console.log(`Site built → ${DIST_DIR}`);
}

//
// * Assets
//

/**
 * Bundles the client entrypoint into `assets/`, returning the URL of what Bun
 * actually wrote rather than a predicted name.
 */
async function bundleClient(): Promise<string> {
  // ! Do not pass `sourcemap` together with a single `outfile` here —
  // ! Bun 1.3.x silently writes nothing. Keep `outdir`.
  const output = await Bun.build({
    entrypoints: [join(SRC_DIR, SCRIPT_ENTRYPOINT)],
    outdir: join(DIST_DIR, ASSETS_DIR_NAME),
    target: 'browser',
    minify: true,
    naming: '[name].[hash].[ext]',
  });

  return `/${ASSETS_DIR_NAME}/${basename(entryArtifact(output, SCRIPT_ENTRYPOINT).path)}`;
}

/**
 * Copies the stylesheet into `assets/` under a hashed name, rewriting the
 * dev-relative font prefix to where the fonts land in `dist/` — see
 * {@link CSS_FONT_PATH}.
 */
async function copyStyle(): Promise<Stylesheet> {
  const [from, to] = CSS_FONT_PATH;
  const source = await Bun.file(join(SRC_DIR, STYLE_SOURCE)).text();
  const css = source.replaceAll(from, to);

  if (css === source) {
    throw new Error(
      `${STYLE_SOURCE} carries no "${from}" font path — the rewrite would be a no-op`,
    );
  }

  const name = hashedName(STYLE_SOURCE, contentHash(css));
  await Bun.write(join(DIST_DIR, ASSETS_DIR_NAME, name), css);

  return { url: `/${ASSETS_DIR_NAME}/${name}`, css };
}

/**
 * Copies every self-hosted font into `dist/fonts/`, then asserts the stylesheet
 * can actually reach each face it asks for.
 *
 * Copying and rewriting are independent steps: on their own, a renamed or absent
 * `.woff2` leaves both succeeding and the build exits 0 having shipped a page
 * whose fonts 404.
 */
async function copyFonts(css: string): Promise<void> {
  const source = join(PUBLIC_DIR, FONTS_DIR_NAME);
  const target = join(DIST_DIR, FONTS_DIR_NAME);

  for (const entry of await readdir(source)) {
    if (!entry.endsWith('.woff2')) continue;
    await Bun.write(join(target, entry), Bun.file(join(source, entry)));
  }

  const referenced = fontReferences(css);
  if (referenced.size === 0) {
    throw new Error(`${STYLE_SOURCE} loads no fonts from "${CSS_FONT_PATH[1]}" after the rewrite`);
  }

  const missing: string[] = [];
  for (const name of referenced) {
    if (!(await Bun.file(join(target, name)).exists())) missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(
      `${STYLE_SOURCE} references ${missing.length} font(s) absent from ` +
        `dist/${FONTS_DIR_NAME}/: ${missing.join(', ')}`,
    );
  }
}

/** Filenames the rewritten stylesheet loads, derived from {@link CSS_FONT_PATH}. */
function fontReferences(css: string): Set<string> {
  const [, prefix] = CSS_FONT_PATH;
  const pattern = new RegExp(`url\\(['"]?${escapeRegExp(prefix)}([^'")]+)['"]?\\)`, 'g');

  return new Set([...css.matchAll(pattern)].map(([, name]) => name));
}

async function copyFavicon(): Promise<void> {
  await Bun.write(join(DIST_DIR, FAVICON), Bun.file(join(PUBLIC_DIR, FAVICON)));
}

//
// * Content
//

/**
 * Resolves every locale's manual and writes it to `content/<locale>.<hash>.json`,
 * returning the same objects the prerender pass renders from — the page and the
 * JSON a tab click fetches cannot drift.
 */
async function writeContent(): Promise<Map<Locale, Page>> {
  const pages = new Map<Locale, Page>();

  for (const locale of SITE_LOCALES) {
    const manual = resolveExamples(resolveManual(locale));
    const json = JSON.stringify(manual);
    const name = hashedName(`${locale}.json`, contentHash(json));

    await Bun.write(join(DIST_DIR, CONTENT_DIR_NAME, name), json);
    pages.set(locale, { manual, contentUrl: `/${CONTENT_DIR_NAME}/${name}` });
  }

  return pages;
}

//
// * Pages
//

/** Fills the shell once per locale and writes `dist/<locale>/index.html`. */
async function writePages(
  pages: Map<Locale, Page>,
  assets: { script: string; style: string },
): Promise<void> {
  const template = await Bun.file(join(SITE_DIR, TEMPLATE_SOURCE)).text();
  const contentUrls = contentUrlsScript(pages);

  for (const [locale, { manual }] of pages) {
    const html = fill(template, {
      lang: locale,
      dir: localeDir(locale),
      title: escapeHtml(manual.meta.title),
      description: escapeHtml(manual.meta.description),
      hreflang: alternateLinks(locale),
      style: assets.style,
      script: assets.script,
      contentUrls,
      hero: renderHero(manual, locale),
      tabs: renderTabs(locale),
      manual: renderManual(manual, locale),
    });

    await Bun.write(join(DIST_DIR, locale, 'index.html'), html);
  }
}

/**
 * Substitutes every `{{slot}}` in one pass, so a value that happens to contain
 * `{{` cannot be rescanned. An unknown slot throws.
 *
 * HTML comments are matched and passed through untouched: a comment that names a
 * slot for documentation (e.g. "lives in the shell rather than in {{hero}}")
 * would otherwise have it silently substituted, doubling the page with content
 * hidden inside a comment. `checkTemplateSlots` then catches the untouched
 * `{{...}}` as an unfilled slot.
 */
function fill(template: string, slots: Record<string, string>): string {
  return template.replace(/<!--[\s\S]*?-->|\{\{(\w+)\}\}/g, (match, name?: string) => {
    if (name === undefined) return match;

    const value = slots[name];
    if (value === undefined) throw new Error(`template slot "{{${name}}}" has no value`);

    return value;
  });
}

/** The canonical URL for this page plus a reciprocal link to every locale. */
function alternateLinks(active: Locale): string {
  return [
    `<link rel="canonical" href="${pageUrl(active)}" />`,
    ...SITE_LOCALES.map(
      (locale) => `<link rel="alternate" hreflang="${locale}" href="${pageUrl(locale)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
  ].join('\n    ');
}

/**
 * Publishes where each locale's content JSON landed, so a tab click knows what
 * to fetch without guessing a hash.
 */
function contentUrlsScript(pages: Map<Locale, Page>): string {
  const urls = Object.fromEntries(
    [...pages].map(([locale, { contentUrl }]) => [locale, contentUrl]),
  );
  // A stray `</script` in a URL would end the block early.
  const json = JSON.stringify(urls).replaceAll('<', '\\u003c');

  return `<script type="application/json" id="content-urls">${json}</script>`;
}

/**
 * Writes `dist/index.html`, the shim a visitor to `/` lands on. The detection
 * code is inlined rather than emitted as an asset — see
 * {@link REDIRECT_ENTRYPOINT}.
 */
async function writeRedirectShim(): Promise<void> {
  const output = await Bun.build({
    entrypoints: [join(SRC_DIR, REDIRECT_ENTRYPOINT)],
    target: 'browser',
    minify: true,
  });

  const code = (await entryArtifact(output, REDIRECT_ENTRYPOINT).text()).replaceAll(
    '</script',
    '<\\/script',
  );

  const choices = SITE_LOCALES.map(
    (locale) => `<a href="/${locale}/" lang="${locale}">${escapeHtml(LOCALE_NAMES[locale])}</a>`,
  ).join(' ');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script>${code}</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Roll Robot</title>
    <link rel="icon" type="image/svg+xml" href="/${FAVICON}" />
  </head>
  <body>
    <noscript>
      <p>Roll Robot — choose a language:</p>
      ${choices}
    </noscript>
  </body>
</html>
`;

  await Bun.write(join(DIST_DIR, 'index.html'), html);
}

//
// * Helpers
//

function pageUrl(locale: Locale): string {
  return `${SITE_ORIGIN}/${locale}/`;
}

/** `style.css` + `a1b2c3d4` → `style.a1b2c3d4.css`. */
function hashedName(source: string, hash: string): string {
  const dot = source.lastIndexOf('.');

  return `${source.slice(0, dot)}.${hash}${source.slice(dot)}`;
}

/** Fails loudly on a broken bundle, and on anything but exactly one entrypoint. */
function entryArtifact(output: Bun.BuildOutput, entrypoint: string): Bun.BuildArtifact {
  if (!output.success) {
    console.error(`Bundling ${entrypoint} failed:`);
    for (const log of output.logs) console.error(log);
    process.exit(1);
  }

  const entries = output.outputs.filter((artifact) => artifact.kind === 'entry-point');
  const [entry] = entries;

  if (entry === undefined || entries.length > 1) {
    throw new Error(`expected one bundle for ${entrypoint}, found ${entries.length}`);
  }

  return entry;
}

await build();

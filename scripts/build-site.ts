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
import { DEFAULT_SITE_LOCALE, LOCALE_NAMES, localeDir, SITE_LOCALES } from '../site/src/locales';
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
  ICON_SIZES,
  OG_IMAGE,
  OG_IMAGE_SIZE,
  PUBLIC_DIR,
  REDIRECT_ENTRYPOINT,
  SCRIPT_ENTRYPOINT,
  SITE_DIR,
  SITE_ORIGIN,
  SRC_DIR,
  STYLE_SOURCE,
  TEMPLATE_SOURCE,
  THEME_COLORS,
} from './site-manifest';

/** A locale's resolved manual paired with the URL its JSON was written to. */
type Page = { manual: ResolvedManual; contentUrl: string };

async function build(): Promise<void> {
  await rm(DIST_DIR, { recursive: true, force: true });

  const script = await bundleClient();
  // ! Fonts before the stylesheet, and not the other way round: `copyStyle`
  // ! rewrites their hashed names into the CSS, and the stylesheet's own hash
  // ! covers that rewritten text.
  const fonts = await copyFonts();
  const style = await copyStyle(fonts);

  await copyIcons();

  const pages = await writeContent();
  await writePages(pages, { script, style });
  await writeRedirectShim(pages);
  await writeHeaders();
  await writeRobots();
  await writeSitemap();

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
 * Copies every self-hosted font into `dist/fonts/` under a content-hashed name,
 * returning what each one landed as so {@link copyStyle} can repoint the CSS.
 *
 * Hashed rather than copied verbatim because `_headers` serves this directory
 * `immutable` for a year — see {@link writeHeaders}. The Cyrillic and Arabic
 * faces are untrimmed (see `site/public/fonts/README.md`), so re-cutting one
 * under its own name is a thing that will happen, and under a verbatim name it
 * would strand every prior visitor on the stale face with no way to bust it.
 */
async function copyFonts(): Promise<Map<string, string>> {
  const source = join(PUBLIC_DIR, FONTS_DIR_NAME);
  const target = join(DIST_DIR, FONTS_DIR_NAME);
  const names = new Map<string, string>();

  for (const entry of await readdir(source)) {
    if (!entry.endsWith('.woff2')) continue;

    const file = Bun.file(join(source, entry));
    const hashed = hashedName(entry, contentHash(await file.bytes()));

    await Bun.write(join(target, hashed), file);
    names.set(entry, hashed);
  }

  if (names.size === 0) {
    throw new Error(`no .woff2 files in ${join(PUBLIC_DIR, FONTS_DIR_NAME)}`);
  }

  return names;
}

/**
 * Copies the stylesheet into `assets/` under a hashed name, rewriting the
 * dev-relative font prefix to where the fonts land in `dist/` — see
 * {@link CSS_FONT_PATH} — and each filename to its hashed form.
 */
async function copyStyle(fonts: Map<string, string>): Promise<string> {
  const [from, to] = CSS_FONT_PATH;
  const source = await Bun.file(join(SRC_DIR, STYLE_SOURCE)).text();
  const rewritten = source.replaceAll(from, to);

  if (rewritten === source) {
    throw new Error(
      `${STYLE_SOURCE} carries no "${from}" font path — the rewrite would be a no-op`,
    );
  }

  const css = rewriteFontNames(rewritten, fonts);
  const name = hashedName(STYLE_SOURCE, contentHash(css));

  await Bun.write(join(DIST_DIR, ASSETS_DIR_NAME, name), css);

  return `/${ASSETS_DIR_NAME}/${name}`;
}

/**
 * Repoints every `url(../fonts/…)` at the hashed name the face was written under.
 *
 * Rewriting is what proves the two halves agree: a face the stylesheet asks for
 * that `copyFonts` never wrote has no hashed name to substitute, and throws here
 * rather than shipping a page whose fonts 404.
 */
function rewriteFontNames(css: string, fonts: Map<string, string>): string {
  const [, prefix] = CSS_FONT_PATH;
  const pattern = new RegExp(`(url\\(['"]?${escapeRegExp(prefix)})([^'")]+)(['"]?\\))`, 'g');

  const missing: string[] = [];
  let referenced = 0;

  const rewritten = css.replace(pattern, (match, open: string, name: string, close: string) => {
    referenced += 1;

    const hashed = fonts.get(name);
    if (hashed === undefined) {
      missing.push(name);
      return match;
    }

    return `${open}${hashed}${close}`;
  });

  if (referenced === 0) {
    throw new Error(`${STYLE_SOURCE} loads no fonts from "${prefix}" after the rewrite`);
  }

  if (missing.length > 0) {
    throw new Error(
      `${STYLE_SOURCE} references ${missing.length} font(s) absent from ` +
        `dist/${FONTS_DIR_NAME}/: ${missing.join(', ')}`,
    );
  }

  return rewritten;
}

/**
 * Copies the SVG favicon and its PNG ladder into the `dist/` root.
 *
 * Not hashed, unlike everything else: `/favicon.svg` and `/favicon-180.png` are
 * referenced by convention from places that cannot read a manifest — an Apple
 * touch icon, a bookmark, a link-preview fetcher — so the names have to be
 * stable. `_headers` leaves the root out of `immutable` for exactly this reason.
 */
async function copyIcons(): Promise<void> {
  await Bun.write(join(DIST_DIR, FAVICON), Bun.file(join(PUBLIC_DIR, FAVICON)));

  for (const size of ICON_SIZES) {
    const name = `favicon-${size}.png`;
    const source = Bun.file(join(PUBLIC_DIR, name));

    if (!(await source.exists())) {
      throw new Error(`${name} missing from site/public/ — rasterize it from ${FAVICON}`);
    }

    await Bun.write(join(DIST_DIR, name), source);
  }
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
      icons: iconLinks(),
      social: socialTags(manual, locale, pageUrl(locale)),
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

/**
 * The icon set and the two `theme-color` tags, identical on every page.
 *
 * Each `rel` carries its own meaning — a bookmark icon, an Apple touch icon —
 * so these are written out rather than derived from {@link ICON_SIZES}, which
 * exists to say what gets *copied*. `check-site.ts` asserts each href resolves.
 */
function iconLinks(): string {
  const [light, dark] = THEME_COLORS;

  return [
    `<link rel="icon" type="image/svg+xml" href="/${FAVICON}" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png" />`,
    `<meta name="theme-color" content="${light}" media="(prefers-color-scheme: light)" />`,
    `<meta name="theme-color" content="${dark}" media="(prefers-color-scheme: dark)" />`,
  ].join('\n    ');
}

/**
 * `og:locale` wants `language_TERRITORY`, which the bare tags the pages are
 * keyed on are not. Build-only, so it stays out of `locales.ts` and out of the
 * browser bundle.
 */
const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  de: 'de_DE',
  ru: 'ru_RU',
  uk: 'uk_UA',
  be: 'be_BY',
  fa: 'fa_IR',
};

/**
 * Link-preview tags, chiefly for Telegram — where this page is shared far more
 * than anywhere else, and where a bare URL with no card is what shipped before.
 *
 * `meta.social` rather than `meta.description`: the latter is written for a
 * search result and runs past what a card will show. A square image with
 * `twitter:card: summary` matches edloidas.io, whose own card this mirrors.
 *
 * ! These describe the *prerendered* locale and are not updated by the in-place
 * ! tab switch in `main.ts`. That is fine — no crawler or preview fetcher clicks
 * ! a tab — so do not "fix" it by re-rendering the head on every switch.
 */
function socialTags(manual: ResolvedManual, locale: Locale, url: string): string {
  const title = escapeHtml(manual.meta.title);
  const social = escapeHtml(manual.meta.social);
  const image = `${SITE_ORIGIN}/${OG_IMAGE}`;

  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Roll Robot" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${social}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${OG_LOCALES[locale]}" />`,
    ...SITE_LOCALES.filter((other) => other !== locale).map(
      (other) => `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}" />`,
    ),
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_SIZE}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_SIZE}" />`,
    `<meta property="og:image:alt" content="Roll Robot" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${social}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="Roll Robot" />`,
  ].join('\n    ');
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
async function writeRedirectShim(pages: Map<Locale, Page>): Promise<void> {
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

  // The shim redirects rather than answering for itself, so it carries English:
  // whoever reads it — a no-JS visitor, a preview fetcher — got no locale from
  // the URL either.
  const page = pages.get(DEFAULT_SITE_LOCALE);
  if (page === undefined) throw new Error(`no "${DEFAULT_SITE_LOCALE}" page for the root shim`);

  const { manual } = page;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script>${code}</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <!-- No stylesheet here — this page exists to be left. Without a declared
         scheme a dark-mode visitor gets a white frame for the length of the
         redirect, on the way to a dark page. -->
    <style>:root{color-scheme:light dark}</style>
    <title>${escapeHtml(manual.meta.title)}</title>
    <meta name="description" content="${escapeHtml(manual.meta.description)}" />
    <meta name="author" content="Mikita Taukachou" />
    <meta name="robots" content="index, follow" />
    ${iconLinks()}
    ${socialTags(manual, DEFAULT_SITE_LOCALE, `${SITE_ORIGIN}/`)}
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
// * Site files
//

/**
 * Writes `dist/_headers`, which is how Cloudflare Pages learns what may be
 * cached. Without it every asset is served `max-age=0, must-revalidate`.
 *
 * ! Only content-hashed directories may take `immutable`. All three below are —
 * ! `assets/` and `content/` by construction, `fonts/` because {@link copyFonts}
 * ! hashes them too. A verbatim filename here would pin a stale file for a year.
 */
async function writeHeaders(): Promise<void> {
  const immutable = [ASSETS_DIR_NAME, FONTS_DIR_NAME, CONTENT_DIR_NAME]
    .map((dir) => `/${dir}/*\n  Cache-Control: public, max-age=31536000, immutable\n`)
    .join('\n');

  const headers =
    `/*\n` +
    `  X-Content-Type-Options: nosniff\n` +
    `  Referrer-Policy: strict-origin-when-cross-origin\n\n` +
    immutable;

  await Bun.write(join(DIST_DIR, '_headers'), headers);
}

async function writeRobots(): Promise<void> {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;

  await Bun.write(join(DIST_DIR, 'robots.txt'), robots);
}

/**
 * Lists the eight locale pages.
 *
 * Not `/`: it is the `x-default` target but it only ever redirects, and a
 * sitemap is for pages that answer for themselves. No `lastmod` either —
 * stamping build time would make every rebuild look like a content change.
 */
async function writeSitemap(): Promise<void> {
  const urls = SITE_LOCALES.map((locale) => `  <url>\n    <loc>${pageUrl(locale)}</loc>\n  </url>`);

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>\n`;

  await Bun.write(join(DIST_DIR, 'sitemap.xml'), sitemap);
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

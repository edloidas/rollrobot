/**
 * Single source of truth for the landing page's on-disk layout.
 *
 * `build-site.ts` emits these paths and `check-site.ts` asserts them afterwards,
 * so a renamed directory cannot drift between the two sides.
 *
 * The built tree is served from the domain root and the pages live one level
 * down under `/<locale>/`, so every URL a page carries is root-relative.
 */

import { join } from 'node:path';

export const ROOT_DIR = join(import.meta.dir, '..');
export const SITE_DIR = join(ROOT_DIR, 'site');
export const SRC_DIR = join(SITE_DIR, 'src');
export const PUBLIC_DIR = join(SITE_DIR, 'public');
export const DIST_DIR = join(SITE_DIR, 'dist');

/** Directory names inside `site/dist/`. */
export const ASSETS_DIR_NAME = 'assets';
export const FONTS_DIR_NAME = 'fonts';
export const CONTENT_DIR_NAME = 'content';

/** Browser entrypoint in `site/src/`, bundled into `assets/` as hashed `.js`. */
export const SCRIPT_ENTRYPOINT = 'main.ts';

/**
 * Entrypoint for the root shim's detection logic. Inlined into `dist/index.html`
 * rather than written to `assets/`: a redirect that waits on a second request is
 * a visible blank frame.
 */
export const REDIRECT_ENTRYPOINT = 'redirect.ts';

/** Stylesheet in `site/src/`, copied into `assets/` rather than bundled. */
export const STYLE_SOURCE = 'style.css';

/** Page shell in `site/`, filled once per locale. */
export const TEMPLATE_SOURCE = 'index.template.html';

/** Files copied from `site/public/` into the `dist/` root. */
export const FAVICON = 'favicon.svg';

/**
 * PNG fallbacks for the SVG favicon, rasterized from it and committed rather
 * than generated — `sharp` is only in `node_modules` as a transitive dependency
 * of `miniflare`, so a build script must not reach for it.
 */
export const ICON_SIZES = [16, 32, 180, 512] as const;

/** The largest icon, reused as the link-preview card image. */
export const OG_IMAGE_SIZE = 512;
export const OG_IMAGE = `favicon-${OG_IMAGE_SIZE}.png`;

/**
 * `--bg` in each palette, mirrored into `<meta name="theme-color">`. Declared
 * here rather than retyped in the template so `check-site.ts` can assert both
 * still appear in the emitted stylesheet.
 */
export const THEME_COLORS: readonly [light: string, dark: string] = ['#f5ecdb', '#16120b'];

/**
 * The stylesheet's `@font-face` URLs are written relative to `site/src/`, so
 * `site/public/fonts/` resolves during development. In `dist/` the stylesheet
 * sits in `assets/` and the fonts one level up, so the prefix has to move.
 *
 * The hash covers the rewritten text, so a change here moves the filename too.
 */
export const CSS_FONT_PATH: readonly [from: string, to: string] = [
  `../public/${FONTS_DIR_NAME}/`,
  `../${FONTS_DIR_NAME}/`,
];

/** Canonical origin, used for the `hreflang` and `canonical` links. */
export const SITE_ORIGIN = 'https://rollrobot.edloidas.io';

/**
 * Stands in for Bun's `[hash]` slot, which only covers what the bundler writes.
 *
 * Takes bytes as well as text because the fonts are hashed too — they are copied
 * rather than bundled, and a `.woff2` has no text form to hash.
 */
export function contentHash(content: string | Uint8Array): string {
  return new Bun.CryptoHasher('sha256').update(content).digest('hex').slice(0, 8);
}

/**
 * Quotes a literal for use inside a `RegExp`. Both sides build patterns out of
 * the names above rather than retyping them, so the escaper belongs here too.
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

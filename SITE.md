# Landing page

[rollrobot.edloidas.io](https://rollrobot.edloidas.io) is a Cloudflare Pages project, wholly
separate from the Worker in [DEPLOYMENT.md](DEPLOYMENT.md): different deploy, different
trigger, different failure mode. A Worker outage leaves the page up, and a broken page
never reaches Telegram.

The site is fully static — eight prerendered pages, one per locale, plus a root shim that
redirects `/` to the visitor's language in the browser. There is no Pages Function and no
server-side rendering.

[Cloudflare setup](#cloudflare-setup) · [Why Pages](#why-pages-and-not-workers) ·
[What the build emits](#what-the-build-emits) · [Verifying locally](#verifying-locally) ·
[Regenerating the icons](#regenerating-the-icons) · [Adding a locale](#adding-a-locale)

## Cloudflare setup

| | |
| --- | --- |
| Pages project | `rollrobot` — distinct from the Worker of the same name |
| Default URL | `rollrobot.pages.dev` |
| Custom domain | `rollrobot.edloidas.io` |

A Git integration, not a direct upload: Cloudflare clones the repo and builds it, so no
Cloudflare API token is stored here. `site/dist/` is generated and gitignored — Pages
builds it on every push.

**Finding the setup screen.** The dashboard's **Create application** button goes to
Workers, not Pages. Pages is behind the small **"Looking to deploy Pages? Get started"**
link at the bottom of that screen.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `bun run site:build && bun run site:check` |
| Output directory | `site/dist` |
| Root directory | `/` |
| Production branch | `master` |
| Environment variable | `BUN_VERSION` = contents of `.bun-version` |

Then **Custom domains → Set up a domain → `rollrobot.edloidas.io`**. The zone is already on
Cloudflare, so the DNS record is created for you.

**Set `BUN_VERSION`.** Bun is the only runtime in the Pages build image with no
version-file support — Node reads `.nvmrc`, Python reads `.python-version`, Bun reads
nothing. So `.bun-version` pins GitHub Actions only and is invisible to Cloudflare. Unset,
Pages builds on its image default, which has trailed this repo by a full minor version.

**Every branch gets built**, which is where the per-PR preview URLs come from. Wanted here —
eight locales and an RTL layout are worth seeing on a real URL before merging.

## Why Pages and not Workers

Cloudflare recommends [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
for new projects; Pages still works but new features go to Workers. We chose Pages to match
`roll-parser`, which serves the sibling site on the same domain — one model to learn, one
place to look when a deploy breaks.

If that trade stops being worth it, migration is clean. All four things this site depends on
carry over: `_headers` and `_redirects` are natively supported, static asset requests are
free and unlimited, `html_handling: "auto-trailing-slash"` matches what `serve-site.ts`
does, and the site is far inside the 20,000-file limit. It would be a second Worker with an
`assets` block and no script — not a rewrite.

**The check is chained into the build command on purpose.** `check-site.ts` verifies the
tree Pages is about to publish — assets resolve, `hreflang` and `canonical` point where they
should, no template slot went unfilled, the client bundle has not gained `roll-parser`, and
`_headers` never marks an unhashed file `immutable`. A failing check fails the deploy
instead of publishing a broken page.

## What the build emits

`assets/`, `fonts/` and `content/` are content-hashed and served `immutable` for a year.
The `dist/` root is excluded on purpose: favicons, `robots.txt` and `sitemap.xml` are
referenced by convention from places that cannot read a manifest, so their names must stay
stable.

Fonts are hashed too, and have to be — the Cyrillic and Arabic faces are untrimmed (see
`site/public/fonts/README.md`), so re-cutting one is expected, and `immutable` over a
verbatim filename could never be busted.

## Verifying locally

```sh
bun run site:dev
```

Builds and serves `site/dist/` on `:4173`. `serve-site.ts` mirrors Pages' static-directory
behaviour — trailing slash resolves to `index.html`, a bare directory path redirects to the
slashed form, anything else 404s.

Two things it cannot reproduce, both needing a real deploy:

- `_headers`, so caching differs
- link-preview cards, which need a public URL to fetch

## Regenerating the icons

`site/public/favicon-*.png` are rasterized from `favicon.svg` and committed rather than
generated — `sharp` is only a transitive dependency of `miniflare`, and a build must not
rely on that. After editing the SVG:

```sh
bun -e 'const s=require("sharp");const f=await Bun.file("site/public/favicon.svg").arrayBuffer();
for (const n of [16,32,180,512]) await s(Buffer.from(f),{density:900}).resize(n,n).png({compressionLevel:9}).toFile(`site/public/favicon-${n}.png`)'
```

The 512 doubles as the `og:image` on every locale, so check it renders before committing.

## Adding a locale

The page advertises exactly the languages the bot answers in, and `locales.test.ts` asserts
it. Add to `src/i18n.ts` first, then `site/src/locales.ts`, then a manual under
`site/content/`. A locale can land one section at a time — `mergeOverEnglish` fills the rest
from English and marks what fell back, so a half-translated manual shows whole English
sections rather than two languages in one table.

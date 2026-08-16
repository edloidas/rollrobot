# Landing page

[rollrobot.edloidas.io](https://rollrobot.edloidas.io) is a Cloudflare Pages project, wholly
separate from the Worker in [DEPLOYMENT.md](DEPLOYMENT.md): different deploy, different
trigger, different failure mode. A Worker outage leaves the page up, and a broken page
never reaches Telegram.

The site is fully static — eight prerendered pages, one per locale, plus a root shim that
redirects `/` to the visitor's language in the browser. There is no Pages Function and no
server-side rendering.

[Cloudflare setup](#cloudflare-setup) · [What the build emits](#what-the-build-emits) ·
[Verifying locally](#verifying-locally) · [Regenerating the icons](#regenerating-the-icons) ·
[Adding a locale](#adding-a-locale)

## Cloudflare setup

A Git integration, not a direct upload: Cloudflare clones the repository and builds it, so
no Cloudflare API token is ever stored in this repository. `site/dist/` is generated and
gitignored — Pages builds it on every push.

| Setting | Value |
| --- | --- |
| Build command | `bun run site:build && bun run site:check` |
| Output directory | `site/dist` |
| Root directory | `/` |
| Production branch | `master` |
| Environment variable | `BUN_VERSION` = the contents of `.bun-version` |

`BUN_VERSION` is not optional housekeeping. Bun is the one runtime in the Pages build image
with **no version-file support** — Node.js reads `.nvmrc`, Python reads `.python-version`,
but Bun is settable only through that environment variable, so `.bun-version` is invisible
to Cloudflare and pins GitHub Actions alone. Left unset, Pages builds on whatever its image
defaults to, which has trailed this repository by a full minor version.

Pages builds every branch it sees, which is where the per-PR preview URLs come from. That
is deliberate here — eight locales and an RTL layout are worth looking at on a real URL
before merging — but it does mean every branch you push gets built.

### Why the check runs in the build command

`bun scripts/check-site.ts` verifies the tree Pages is about to publish: that every
referenced asset exists, that `hreflang` and `canonical` point where they should, that no
template slot went unfilled, that the client bundle has not silently gained `roll-parser`,
that the light palette's two declaration blocks still agree, and that `_headers` never marks
an unhashed file `immutable`. Chaining it into the build command is what makes a failing
check fail the deploy rather than publish a broken page.

## What the build emits

Everything under `assets/`, `fonts/` and `content/` is content-hashed and served
`immutable` for a year via `_headers`. The `dist/` root is deliberately excluded: the
favicons, `robots.txt` and `sitemap.xml` are referenced by convention from places that
cannot read a manifest, so their names have to stay stable.

The fonts are hashed like everything else. They have to be — the Cyrillic and Arabic faces
are untrimmed (see `site/public/fonts/README.md`), so re-cutting one is anticipated, and an
`immutable` header over a verbatim filename could never be busted.

## Verifying locally

```sh
bun run site:dev
```

Builds and serves `site/dist/` on `:4173`. `scripts/serve-site.ts` mirrors what Pages does
with a static directory — a trailing slash resolves to `index.html`, a bare directory path
redirects to the slashed form, anything else is a 404 — so what you see locally is what
Pages serves.

Two things it does **not** reproduce, both of which need a deploy to review:

- `_headers`, so caching behaves differently
- link-preview cards, which need a public URL for Telegram or a card validator to fetch

## Regenerating the icons

`site/public/favicon-*.png` are rasterized from `favicon.svg` and committed, not generated
at build time — `sharp` reaches the repository only as a transitive dependency of
`miniflare`, and a build must not depend on that. After editing the SVG:

```sh
bun -e 'const s=require("sharp");const f=await Bun.file("site/public/favicon.svg").arrayBuffer();
for (const n of [16,32,180,512]) await s(Buffer.from(f),{density:900}).resize(n,n).png({compressionLevel:9}).toFile(`site/public/favicon-${n}.png`)'
```

The 512 is also the `og:image` for every locale's link preview, so check it renders before
committing.

## Adding a locale

The page advertises exactly the languages the bot answers in, and `locales.test.ts` asserts
that. Adding one means `src/i18n.ts` first, then `site/src/locales.ts`, then a manual under
`site/content/`. A locale may land one section at a time — `mergeOverEnglish` fills the rest
from English and marks what fell back, so a half-translated manual renders as whole
sections rather than two languages inside one table.

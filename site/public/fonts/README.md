# Fonts

Self-hosted woff2 files, downloaded from Google Fonts. Latin subsets are
byte-identical copies of the ones `roll-parser`'s `site/` self-hosts; the
Cyrillic and Arabic subsets are new here, added because this site serves
`ru`/`uk`/`be` (Cyrillic) and `fa` (Arabic) locales that `roll-parser` never
needed to cover.

- **Cinzel** (`cinzel-latin.woff2`) — headings, wordmark (`--font-head`). Variable, axis-limited to weight 400–700 (copied from `roll-parser`, which trims it — see below). Latin only — see the Cyrillic/Arabic note below. Source: <https://fonts.google.com/specimen/Cinzel>. License: SIL Open Font License 1.1.
- **IBM Plex Sans** (`ibm-plex-sans-latin.woff2`, `ibm-plex-sans-cyrillic.woff2`) — body text (`--font-body`). Latin file: variable, axis-limited to 400–700 (copied from `roll-parser`). Cyrillic file: variable, full native axis 100–700, untrimmed (see below) — body text for `ru`/`uk`/`be`. Source: <https://fonts.google.com/specimen/IBM+Plex+Sans>. License: SIL Open Font License 1.1.
- **JetBrains Mono** (`jetbrains-mono-latin.woff2`, `jetbrains-mono-cyrillic.woff2`) — notation, code-like text (`--font-mono`). Latin file: variable, axis-limited to 400–700 (copied from `roll-parser`). Cyrillic file: variable, full native axis 400–800, untrimmed — notation in Cyrillic locales. Source: <https://fonts.google.com/specimen/JetBrains+Mono>. License: SIL Open Font License 1.1.
- **Vazirmatn** (`vazirmatn-arabic.woff2`) — body and headings for `fa` (`--font-body`, and `--font-head` override — see below). Variable, full native axis 100–900, untrimmed. Source: <https://fonts.google.com/specimen/Vazirmatn>. License: SIL Open Font License 1.1.

All four are variable fonts covering their weight axis in a single file each;
`@font-face` rules in `style.css` map the weight range to that one
file per script. The Latin files are byte-identical copies of `roll-parser`'s
already axis-limited files; the new Cyrillic/Arabic files are untrimmed (see
"Deliberately skipped: axis limiting" below).

## Sourcing

Each Cyrillic/Arabic file was pulled from the per-script subset Google Fonts'
`css2` endpoint already serves, rather than subsetting a downloaded file
locally:

```bash
curl -s -H 'User-Agent: <modern desktop Chrome UA>' \
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400..700&display=swap'
```

The endpoint's format/split behavior depends on the `User-Agent` header — a
generic `Mozilla/5.0` UA gets an old-browser response (single unsplit `.ttf`,
no `unicode-range` at all); a modern Chrome UA string gets the current
woff2-per-script response actually used in production, which is what these
files are.

The response is one `@font-face` block per script, each preceded by a CSS
comment naming the script and each carrying its own `unicode-range`. Blocks
used here:

| File | CSS comment | `unicode-range` |
|---|---|---|
| `ibm-plex-sans-cyrillic.woff2` | `/* cyrillic */` | `U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116` |
| `jetbrains-mono-cyrillic.woff2` | `/* cyrillic */` | `U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116` |
| `vazirmatn-arabic.woff2` | `/* arabic */` | `U+0600-06FF, U+0750-077F, U+0870-088E, …` (core Arabic block plus extensions) |

Deliberately **not** `cyrillic-ext` (`U+0460-052F` etc.) — that block is for
Old Church Slavonic and other extended-Cyrillic scripts none of `ru`/`uk`/`be`
need. The plain `cyrillic` block already includes `U+0490-0491` (Ukrainian
ґ/Ґ) and the rest of Ukrainian/Belarusian's distinguishing letters (e.g.
Belarusian ў is `U+045E`, inside the main `U+0400-045F` range), so one file
covers all three Cyrillic locales. Likewise `arabic` (not a `latin-ext`
variant) is the core block: Persian-specific letters پ, چ, ژ, گ all fall
inside `U+0600-06FF`, so the Arabic subset covers Farsi without pulling in
unrelated scripts.

## Deliberately skipped: axis limiting

`roll-parser`'s font README describes trimming each variable file's weight
axis to just the range the site uses (`fonttools varLib.instancer … wght=400:700`),
saving roughly 12 kB per file with no visible change. **That step is skipped
here.** `fonttools` is not installed on this machine, and installing a Python
toolchain to shave a few kB is not worth a machine-level side effect for this
task. Every file here ships at whatever weight range Google Fonts' `css2`
response serves for that script (see the axis note per family above) — wider
than strictly needed, but correct.

The `:wght@400..700` range in the query above does **not** trim the served
file — confirmed by requesting the same family at several different ranges
(`100..700`, `400..700`, `400..900`) and observing an identical `src: url(...)`
each time. The range only changes the `font-weight` descriptor Google's CSS
writes; the binary is always that script's one native-axis variable font.
There is no query-string shortcut around `fonttools` here.

## Cinzel has no Cyrillic or Arabic coverage

Cinzel is a Latin-only display serif — Google Fonts does not offer it with a
Cyrillic or Arabic subset, so there is no `cinzel-cyrillic.woff2` or
`cinzel-arabic.woff2` to add. `--font-head` is therefore overridden per locale
in `style.css`: Cyrillic locales fall back to the system serif
stack, and `fa` uses Vazirmatn for headings as well as body. Adding a Cyrillic
display serif later is a drop-in replacement for that override — nothing else
reads the variable.

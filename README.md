<h1 align="center">Roll Robot</h1>

<p align="center">
Dice notation for tabletop RPGs, rolled in any Telegram chat.
</p>

<p align="center">
  <a href="https://telegram.me/rollrobot"><img src="https://img.shields.io/badge/Telegram-%40rollrobot-2ca5e0?logo=telegram&logoColor=white" alt="@rollrobot on Telegram"></a>
  <a href="https://github.com/edloidas/rollrobot/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/edloidas/rollrobot/test.yml?branch=master&label=CI" alt="CI status"></a>
  <a href="https://github.com/edloidas/rollrobot/blob/master/LICENSE"><img src="https://img.shields.io/github/license/edloidas/rollrobot?color=blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://telegram.me/rollrobot"><strong>Open the bot</strong></a> ·
  <a href="https://roll-parser.edloidas.io/"><strong>Playground</strong></a> ·
  <a href="https://roll-parser.edloidas.io/reference"><strong>Notation Guide</strong></a> ·
  <a href="DEPLOYMENT.md"><strong>Deployment</strong></a> ·
  <a href="SITE.md"><strong>Landing page</strong></a> ·
  <a href="ANALYTICS.md"><strong>Analytics</strong></a>
</p>

Dice for tabletop RPGs in any chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate,
Savage Worlds, Call of Cthulhu. Add [@rollrobot](https://telegram.me/rollrobot) to a group,
or type `@rollrobot` in any chat to roll without adding it anywhere:

```
/full 2d20+5

2d20 + 5 = 32
[20↑, 7] + 5
```

Notation is parsed by [roll-parser](https://github.com/edloidas/roll-parser) v3 — keep/drop,
exploding dice, rerolls, min/max clamps, success pools, grouped rolls, and checks against a
DC. `4d6kh3` for ability scores, `2d20kh1+7` with advantage, `1d20+12 vs 20` for a Pathfinder
check, `7d10>=6f1` for a Storyteller pool, `{1d8!, 1d6!}kh1` for Savage Worlds, `4dF` for
Fate, `d%` for Call of Cthulhu.

## Commands

| Command | Shortcut | Result |
| --- | --- | --- |
| `/roll [notation]` | `/r` | The normalized expression and its total |
| `/full [notation]` | `/f` | The same, plus a die-by-die breakdown |
| `/random` | | A `d100` roll, total only |
| `/ask [question]` | `/a` | The question quoted, and `Yes` or `No` under it |
| `/pick [options]` | `/p` | One option out of the list, chosen at random *(beta)* |
| `/help` | | Notation guide and links |

Omitting the notation rolls `d20`. In groups the bot replies to the message it was called
from, so several people can roll at once without the thread coming apart.

`/ask` takes the whole line as its question, so it never fails to parse — quotes, notation and
punctuation are all part of the question rather than syntax. The answer stays English in every
language: the sender's interface language is a poor guess at the language of the chat.

`/pick` splits its options on the first separator tier present, and only that one: a newline,
then `|` `;` `؛`, then `,` `،`, then spaces. So an option may contain any separator below its
own tier — `/pick Potion of Healing, Greater | Armor, +1 Chain Mail` keeps both commas, and a
random table pasted on separate lines works as-is. Repeating an option weights it. A quoted
name at the end labels the pick, as it does for a roll. Since the bot replies to the command
message, the pool stays visible above the answer without being echoed back.

Picking a `@username` mentions them, which is the point — it is how the table settles who
goes first.

Typing `@rollrobot [notation]` in any chat offers one roll under two headings, **Roll** and
**Full** — the choice is about display, not a reroll. With no notation the list falls back to
`d20` and `d100` presets. Anything that is not notation for a named die also offers **Ask**,
leading the list when the query does not roll and trailing it when it does. A query that names
a separator *and* fails to parse leads with **Pick** instead — both halves are required, since
a comma is valid inside `{1d8!, 1d6!}kh1` and `max(1d6, 1d8)`, and the space fallback alone
would turn every question into a list. An inline pick carries its pool in the message, having
no command above it to reply to. Results are personal and uncached, so every new query rolls
afresh.

## Notation

| Example | Meaning |
| --- | --- |
| `2d20+5` | Dice and arithmetic: `+ - * /` and parentheses |
| `4d6kh3` | Keep the highest 3 — also `kl`, `dh`, `dl` |
| `d8!` | Exploding dice |
| `2d6r<3` | Reroll below 3 — `ro` rerolls once |
| `4d6min2` | Clamp each die to at least 2 — also `max` |
| `6d10>=6f1` | Count successes, subtract 1s as failures |
| `1d20+7 vs 15` | Check against a DC, reported as a degree of success |
| `{1d8!, 1d6!}kh1` | Grouped rolls — each sub-roll competes as one die |
| `4dF` · `d%` | Fate dice · percentile |
| `2d6+floor(1d4/2)` | Functions: `floor`, `ceil`, `round`, `abs`, `min`, `max`, `sqrt`, `pow` |

A breakdown marks what the notation asked about: dropped dice are struck through, successes
bold, failures underlined, and natural extremes carry `↑` or `↓`. The extremes are marked
conservatively — only on a single-pool roll, only from d6 upward unless `cs`/`cf` names the
threshold, and never on a die whose face a clamp or an explosion rewrote, which would
otherwise report a critical nobody rolled.

Rolls are capped at 100 dice and 100 explode or reroll iterations, which keeps replies well
inside Telegram's 4096-character message limit. A breakdown that still runs past 3500
characters is dropped in favour of the compact reply.

**Naming a roll.** Quote a name at the end and it appears above the result:
`/roll 2d20kh1+7 "Perception"`.

**Legacy shorthand.** `/roll 20` rolls `d20` and `/roll 2 10 -1` rolls `2d10-1`, the way the
pre-v3 bot did.

Try notation live in the [playground](https://roll-parser.edloidas.io/), or read the full
[notation reference](https://roll-parser.edloidas.io/reference).

## Languages

Inline titles, the command menu, and the notation guide follow your Telegram language:
English, Spanish, Portuguese, German, Russian, Ukrainian, Belarusian, and Persian. Anything
else falls back to English. Roll results are notation, so they read the same everywhere.
Arabic-Indic and Extended Arabic-Indic digits are folded to ASCII before parsing, as is the
Arabic percent sign — `۲۰` rolls a `d20` and `د٪` is still a parse error, since only the
digits are folded, never the letters. A quoted name keeps its own numerals.

## Stack

Cloudflare Workers, TypeScript, Bun, [grammY](https://grammy.dev) in webhook mode, and
[roll-parser](https://github.com/edloidas/roll-parser). The Worker holds no state: it
answers `GET /health` and authenticated Telegram updates at `POST /webhook`, and nothing
else.

## Development

Bun is the only toolchain. Install, then run the full check before committing:

```sh
bun install
bun run validate       # typecheck + lint + format check + tests
bun run test:watch
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) with the issue
number appended — `feat: add inline named rolls #12`. See [CLAUDE.md](CLAUDE.md) for the
issue, branch, and release conventions.

## Deployment

The bot runs as a single Cloudflare Worker behind a Telegram webhook. Deploying it needs
three Worker secrets and one `wrangler` command; registering the webhook is a separate,
deliberate step. See [DEPLOYMENT.md](DEPLOYMENT.md).

The landing page at [rollrobot.edloidas.io](https://rollrobot.edloidas.io) is a separate
Cloudflare Pages deploy — eight prerendered locales, no Worker involvement, so neither can
break the other. See [SITE.md](SITE.md).

## Analytics

Rolls are recorded to an Analytics Engine dataset — one data point per distinct dice term,
plus one per `/start`, `/help`, `/ask` and `/pick`, none of which record a dice term. User IDs
are stored as HMAC-SHA256 digests and the dataset
is write-only from the Worker; without the binding, nothing is recorded and the bot replies
as usual. Reading the data is a local command, `bun run analytics`. See
[ANALYTICS.md](ANALYTICS.md).

## Contributing

Bug reports, notation gaps, and pull requests are welcome — open an
[issue](https://github.com/edloidas/rollrobot/issues) to start.

## License

[MIT](LICENSE) © [Mikita Taukachou](https://edloidas.io)

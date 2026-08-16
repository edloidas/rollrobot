<h1 align="center">Roll Robot</h1>

<p align="center">
Dice for tabletop RPGs in any chat — D&amp;D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.
</p>

<p align="center">
  <a href="https://telegram.me/rollrobot"><img src="https://img.shields.io/badge/Telegram-%40rollrobot-2ca5e0?logo=telegram&logoColor=white" alt="@rollrobot on Telegram"></a>
  <a href="https://github.com/edloidas/rollrobot/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/edloidas/rollrobot/test.yml?branch=master&label=CI" alt="CI status"></a>
  <a href="https://github.com/edloidas/rollrobot/blob/master/LICENSE"><img src="https://img.shields.io/github/license/edloidas/rollrobot?color=blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://telegram.me/rollrobot"><strong>Open the bot</strong></a> ·
  <a href="https://rollrobot.edloidas.io"><strong>Manual</strong></a> ·
  <a href="https://roll-parser.edloidas.io/"><strong>Playground</strong></a>
</p>

Add [@rollrobot](https://telegram.me/rollrobot) to a group, or type `@rollrobot` in any chat to
roll without adding it anywhere:

```
/full 2d20+5

2d20 + 5 = 32
[20↑, 7] + 5
```

The command menu, inline titles, and the manual follow your Telegram language across eight
locales. Results are notation, so they read the same everywhere.

## Commands

| Command | Shortcut | Result |
| --- | --- | --- |
| `/roll [notation]` | `/r` | The normalized expression and its total |
| `/full [notation]` | `/f` | The same, plus a die-by-die breakdown |
| `/random` | | A `d100` roll, total only |
| `/ask [question]` | `/a` | The question quoted, and `Yes` or `No` under it |
| `/pick [options]` | `/p` | One option out of the list, chosen at random *(beta)* |
| `/help` | | Notation guide and links |

Omitting the notation rolls `d20`. In groups the bot replies to the message it was called from,
so several people can roll at once without the thread coming apart.

## Notation

Parsed by [roll-parser](https://github.com/edloidas/roll-parser) — keep/drop, exploding dice,
rerolls, clamps, success pools, grouped rolls, and checks against a DC:

| Example | Meaning |
| --- | --- |
| `2d20+5` | Dice and arithmetic |
| `4d6kh3` | Keep the highest 3 |
| `d8!` | Exploding dice |
| `7d10>=6f1` | Count successes, subtract 1s as failures |
| `1d20+12 vs 20` | Check against a DC, reported as a degree of success |

The [manual](https://rollrobot.edloidas.io) has the full reference; the
[playground](https://roll-parser.edloidas.io/) runs notation live.

## Stack

Cloudflare Workers, TypeScript, Bun, and [grammY](https://grammy.dev) in webhook mode. The
Worker holds no state: it answers `GET /health` and authenticated Telegram updates at
`POST /webhook`, and nothing else. The landing page is a separate Cloudflare Pages deploy of
prerendered locales, so neither deploy can break the other.

## Development

Bun is the only toolchain. Install, then run the full check before committing:

```sh
bun install
bun run validate       # typecheck + lint + format check + tests + site build
bun run test:watch
```

The manual at [rollrobot.edloidas.io](https://rollrobot.edloidas.io) is built from `site/` and
runs on its own:

```sh
bun run site:dev       # build and serve on :4173
bun run site:preview   # serve the last build without rebuilding
bun run site:build     # emit site/dist/
bun run site:check     # verify the tree Cloudflare Pages would publish
```

## Documentation

| Document | Covers |
| --- | --- |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Worker secrets, first deploy, webhook registration, releases |
| [SITE.md](SITE.md) | The Cloudflare Pages landing page and its build |
| [ANALYTICS.md](ANALYTICS.md) | What is recorded, and how to read the report |

## Contributing

Bug reports, notation gaps, and pull requests are welcome — open an
[issue](https://github.com/edloidas/rollrobot/issues) to start.

## License

[MIT](LICENSE) © [Mikita Taukachou](https://edloidas.io)

# Analytics

Every roll is recorded to the `rollrobot_events` Analytics Engine dataset — one data point
per *distinct* dice term, capped at 20 per roll, plus one per `/start` and `/help`. Repeated
shapes collapse, so `2d6+2d6` records a single `2d6`. Nothing identifying is stored: the
Telegram user ID is written as an HMAC-SHA256 digest keyed by `ANALYTICS_SALT`, and the
dataset is write-only from the Worker.

The write is gated on the binding alone. Without `ANALYTICS` nothing is recorded and the bot
replies as usual; with the binding but no `ANALYTICS_SALT`, rows are still written, each
carrying an empty digest that no query can attribute to a user. `wrangler.jsonc` requires the
salt at deploy time to keep that from happening by accident.

Analytics Engine has no dashboard for custom datasets, so `bun run analytics` is the entire
read path. It runs locally against the Cloudflare API and never touches the Worker.

[Access](#access) · [Commands](#commands) · [Report formats](#report-formats) ·
[Reading the numbers](#reading-the-numbers) ·
[Inline rolls](#inline-rolls-are-undercounted) ·
[Game systems](#game-system-signals-are-signals) · [Snapshots](#snapshots)

## Access

Add a Cloudflare API token with **Account · Account Analytics · Read** to `.env`, alongside
the account the dataset lives in:

```dotenv
CF_ACCOUNT_ID=replace-with-cloudflare-account-id
CF_ANALYTICS_TOKEN=replace-with-account-analytics-read-token
INLINE_FEEDBACK_PROBABILITY=100
```

`INLINE_FEEDBACK_PROBABILITY` is optional. It records whatever BotFather's
`/setinlinefeedback` is set to — the API cannot be asked, so the caveat prints the number
only if it is declared here.

## Commands

```sh
bun run analytics                     # full report over the last 30 days
bun run analytics -- --days 7         # narrower window (max 92, the retention limit)
bun run analytics -- --json           # the same report as data
bun run analytics -- --snapshot       # freeze completed days into .analytics/
bun run analytics -- doctor           # latest rows plus write-path assertions
bun run analytics -- quota            # data points per day against the 100k/day allowance
bun run analytics -- sql "SELECT 1"   # one-off query
```

`doctor` is the one to reach for when the numbers look wrong rather than merely small. It
checks that every row carries a 64-character digest (an empty one means `ANALYTICS_SALT`
never reached the Worker, and those rows are permanently un-attributable), that at least one
row names a real surface rather than `unknown`, and that every roll row carries an `NdX`
term. It exits non-zero if any check fails.

## Report formats

The report renders as `table` (default), `json`, or `html`:

```sh
bun run analytics -- --format html --out .tmp/report.html
```

The page is self-contained — inline styles, hand-written SVG, no network access and no build
step — and reads `.analytics/` when it is populated, so it can show more history than the
live retention window.

Charts are withheld rather than faked where the data cannot support them: a series shorter
than three days renders as its table instead of a trend line, and a cohort with no eligible
users reads `n/a` rather than `0%`.

## Reading the numbers

Every table is tagged with how far it can be trusted, because none of the three failure
modes are visible in the figures themselves:

| Tag | Meaning |
| --- | --- |
| `exact` | Aggregated along the dataset index (`index1`), where the sampling correction is lossless. |
| `estimated` | Sample-corrected off the index, so totals drift against each other — measured at +10%. |
| `lower bound` | Distinct-user counts see only rows that survived sampling, and no weighted-distinct function exists to correct for it. A user whose only roll was sampled away is invisible. |

### Inline rolls are undercounted

Inline rolls are recorded on `chosen_inline_result`, which Telegram delivers
probabilistically according to BotFather's `/setinlinefeedback`. At the default setting most
inline rolls are never reported at all. Set `INLINE_FEEDBACK_PROBABILITY` in `.env` to have
the configured value printed alongside the caveat.

The update carries only the query, not the result, so the roll behind a chosen inline result
is re-rolled to recover its shape. The shape is what gets recorded; the total never leaves
the user's chat.

### Game system signals are signals

Recorded dice shapes drop numeric constants, so `4d6kh3` and `4d6kh1` arrive identical. A
`strong` signal means a modifier or die makes the shape distinctive; `weak` means the shape
merely fits the system and would fit a dozen others. Treat the column as a hint about what
people are playing, never as a count of tables running a given game.

## Snapshots

The dataset retains 92 days, so `.analytics/` is the only durable history. `--snapshot`
freezes each completed UTC day once and never rewrites it.

A day is only frozen after it has had two days to settle — data points are not queryable the
instant they are written, and a day captured too eagerly would be permanently short. Days
with no traffic are written as zeroes, because a gap left unwritten is indistinguishable from
a day that was never captured.

Snapshots hold aggregates only, no user hashes. They are meant to be committed, which on a
public repository means publishing daily volume, notation mix, and observed-user counts; add
`.analytics/` to `.gitignore` to keep the history local instead.

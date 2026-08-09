import {
  barChart,
  type BarRow,
  compact,
  esc,
  lineChart,
  percent,
  type Segment,
  type SeriesPoint,
  stackedBar,
  trendIsReadable,
} from './charts';
import type { Metric, Report } from './report';
import type { DaySnapshot } from './snapshot';

/**
 * Categorical slots 1-4, validated as a set against both surfaces. The order is
 * the colourblind-safety mechanism, not a preference — do not resequence without
 * re-validating. Aqua and yellow fall below 3:1 on the light surface, which is why
 * every segment carries a visible label and every chart carries a table twin.
 */
const SERIES = [
  { fill: 'var(--series-1)', labelClass: 'ink-light' },
  { fill: 'var(--series-2)', labelClass: 'ink-dark' },
  { fill: 'var(--series-3)', labelClass: 'ink-dark' },
  { fill: 'var(--series-4)', labelClass: 'ink-dark' },
];

const STYLE = `
:root {
  color-scheme: light;
  --surface-1: #fcfcfb;
  --plane: #f9f9f7;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --muted: #898781;
  --grid: #e1e0d9;
  --border: rgba(11, 11, 11, 0.1);
  --de-emphasis: #c3c2b7;
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --surface-1: #1a1a19;
    --plane: #0d0d0d;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --muted: #898781;
    --grid: #2c2c2a;
    --border: rgba(255, 255, 255, 0.1);
    --de-emphasis: #52514e;
    --series-1: #3987e5;
    --series-2: #d95926;
    --series-3: #199e70;
    --series-4: #c98500;
  }
}

* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 40px 24px 80px;
  background: var(--plane);
  color: var(--text-primary);
  font: 14px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif;
}
main { max-width: 860px; margin: 0 auto; }
h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
h2 { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
p { margin: 0; }
.sub { color: var(--text-secondary); font-size: 13px; }
.muted { color: var(--muted); font-size: 12px; }

.caveats {
  margin: 24px 0 32px;
  padding: 16px 18px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.caveats dt { font-weight: 600; font-size: 12px; margin-top: 10px; }
.caveats dt:first-of-type { margin-top: 0; }
.caveats dd { margin: 0; color: var(--text-secondary); font-size: 12px; }

.hero { margin: 0 0 28px; }
.hero .figure { font-size: 48px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 32px; }
.kpi { background: var(--surface-1); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
.kpi .label { color: var(--text-secondary); font-size: 12px; }
.kpi .value { font-size: 24px; font-weight: 600; margin-top: 2px; }

.card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; }
.card header { margin-bottom: 14px; }
.tag {
  display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 999px;
  background: var(--plane); border: 1px solid var(--border);
  color: var(--text-secondary); font-size: 11px; font-weight: 500; vertical-align: 2px;
}
.warn { color: var(--text-secondary); font-size: 12px; margin-top: 8px; }

.chart { width: 100%; height: auto; overflow: visible; display: block; }
.chart .cat { fill: var(--text-secondary); font-size: 12px; }
.chart .val { fill: var(--text-primary); font-size: 12px; font-weight: 500; }
.chart .tick { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.chart .grid { stroke: var(--grid); stroke-width: 1; }
.chart .on-fill { font-size: 11px; font-weight: 600; }
/* Chosen by each fill's luminance, so both clear 3:1 in either mode */
.chart .ink-light { fill: #ffffff; }
.chart .ink-dark { fill: #0b0b0b; }

.legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 12px; }
.legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }

details { margin-top: 14px; }
summary { cursor: pointer; color: var(--text-secondary); font-size: 12px; }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 12px; }
th, td { text-align: left; padding: 5px 12px 5px 0; border-bottom: 1px solid var(--grid); white-space: nowrap; }
th { color: var(--text-secondary); font-weight: 600; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.empty { color: var(--muted); font-size: 13px; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
`;

function tag<Value>(metric: Metric<Value>): string {
  return `<span class="tag">${esc(metric.precision)}</span>`;
}

function caveatLine<Value>(metric: Metric<Value>): string {
  return metric.caveat ? `<p class="warn">! ${esc(metric.caveat)}</p>` : '';
}

function table(columns: string[], rows: (string | number)[][], numeric: number[] = []): string {
  if (rows.length === 0) return '<p class="empty">No rows in this window.</p>';

  const head = columns
    .map(
      (column, index) => `<th${numeric.includes(index) ? ' class="num"' : ''}>${esc(column)}</th>`,
    )
    .join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell, index) => `<td${numeric.includes(index) ? ' class="num"' : ''}>${esc(String(cell))}</td>`).join('')}</tr>`,
    )
    .join('');

  return `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** Every chart ships its values as text too, so nothing is reachable by colour alone. */
function twin(columns: string[], rows: (string | number)[][], numeric: number[] = []): string {
  return `<details><summary>Table view</summary>${table(columns, rows, numeric)}</details>`;
}

function card(title: string, tagged: string, body: string, note = ''): string {
  return `<section class="card"><header><h2>${esc(title)}${tagged}</h2>${note}</header>${body}</section>`;
}

function addDays(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Frozen days win over the live query wherever they overlap: a snapshot is the
 * settled record of a day, while the live window re-estimates it under sampling
 * every run.
 *
 * ! Gaps are filled with zeroes. The query returns no row for a day nobody rolled,
 *   and the chart spaces points by position — so an unfilled gap would draw a
 *   fortnight of silence as one step, and read as a smooth trend.
 */
function rollSeries(report: Report, snapshots: DaySnapshot[]): SeriesPoint[] {
  const byDay = new Map<string, SeriesPoint>();
  for (const day of report.metrics.rollsPerDay.value) {
    byDay.set(day.day, { day: day.day, value: day.n, frozen: false });
  }
  for (const snapshot of snapshots) {
    byDay.set(snapshot.day, { day: snapshot.day, value: snapshot.rolls, frozen: true });
  }

  const days = [...byDay.keys()].sort();
  if (days.length === 0) return [];

  const filled: SeriesPoint[] = [];
  const last = days[days.length - 1];
  for (let day = days[0]; day <= last; day = addDays(day, 1)) {
    filled.push(byDay.get(day) ?? { day, value: 0, frozen: false });
  }

  return filled;
}

export function renderHtml(report: Report, snapshots: DaySnapshot[]): string {
  const { window, metrics } = report;
  const users = metrics.users.value;
  const modifiers = metrics.modifiers.value;
  const series = rollSeries(report, snapshots);

  // The hero states the window the subtitle names. The chart may reach further back
  // through snapshots, but summing that would answer a question nobody asked.
  const windowRolls = metrics.rollsPerDay.value.reduce((sum, day) => sum + day.n, 0);
  const inlineShare = metrics.surfaces.value.find((row) => row.key === 'inline')?.share ?? 0;

  const liveDays = new Set(metrics.rollsPerDay.value.map((day) => day.day));
  const addedDays = series.filter((point) => point.frozen && !liveDays.has(point.day)).length;

  const activity = trendIsReadable(series)
    ? lineChart(series)
    : `<p class="empty">${series.length} day${series.length === 1 ? '' : 's'} of data — too few to read as a trend. The table view below carries the values.</p>`;

  const systems: BarRow[] = metrics.systems.value.map((row) => ({
    label: row.label,
    value: row.n,
    display: percent(row.share, 0),
    strong: row.confidence === 'strong',
    title: `${row.label}: ${compact(row.n)} terms (${percent(row.share)}), ${row.confidence} signal`,
  }));

  // ! Part-to-whole has to show the whole. There are six possible surfaces and four
  //   slots, so the tail folds into one segment rather than being dropped — cutting
  //   it would rescale the survivors and put every segment out of step with its label.
  const ranked = metrics.surfaces.value;
  const folded =
    ranked.length > SERIES.length
      ? [
          ...ranked.slice(0, SERIES.length - 1),
          {
            key: 'other',
            n: ranked.slice(SERIES.length - 1).reduce((sum, row) => sum + row.n, 0),
            share: ranked.slice(SERIES.length - 1).reduce((sum, row) => sum + row.share, 0),
          },
        ]
      : ranked;

  const surfaces: Segment[] = folded.map((row, index) => ({
    label: row.key,
    value: row.n,
    share: row.share,
    color: SERIES[index].fill,
    labelClass: SERIES[index].labelClass,
  }));

  const buckets: BarRow[] = metrics.buckets.value.map((row) => ({
    label: row.key,
    value: row.n,
    display: percent(row.share, 0),
  }));

  const tokens: BarRow[] = metrics.modifierTokens.value.map((row) => ({
    label: row.token,
    value: row.n,
    display: compact(row.n),
  }));

  const cohort = (label: string, value: { eligible: number; rate: number }) =>
    value.eligible === 0
      ? `${label}: n/a (no cohort old enough yet)`
      : `${label}: ${percent(value.rate)} of ${value.eligible}`;

  const body = [
    '<main>',
    `<h1>rollrobot analytics</h1>`,
    `<p class="sub">${esc(window.first || 'no data')} .. ${esc(window.last || '')} · last ${window.days} days${addedDays > 0 ? ` · charts reach back ${addedDays} day${addedDays === 1 ? '' : 's'} further through snapshots` : ''}</p>`,
    `<p class="muted">Generated ${esc(report.generatedAt)}</p>`,

    '<div class="caveats"><dl>',
    ...Object.entries(report.precisionNotes).map(
      ([key, note]) => `<dt>${esc(key)}</dt><dd>${esc(note)}</dd>`,
    ),
    `<dt>inline</dt><dd>${esc(metrics.surfaces.caveat ?? '')}</dd>`,
    '</dl></div>',

    ...report.warnings.map((warning) => `<p class="warn">! ${esc(warning)}</p>`),

    `<div class="hero"><p class="sub">Rolls recorded in the last ${window.days} days</p><p class="figure">${compact(windowRolls)}</p></div>`,

    '<div class="kpis">',
    `<div class="kpi"><p class="label">Users observed rolling</p><p class="value">${compact(users.observedUsers)}</p></div>`,
    `<div class="kpi"><p class="label">Dice terms per roll</p><p class="value">${metrics.termsPerRoll.value.toFixed(2)}</p></div>`,
    `<div class="kpi"><p class="label">Terms with a modifier</p><p class="value">${percent(modifiers.rate)}</p></div>`,
    `<div class="kpi"><p class="label">Calls sent inline</p><p class="value">${percent(inlineShare, 0)}</p></div>`,
    '</div>',

    card(
      'Rolls per day',
      tag(metrics.rollsPerDay),
      activity +
        twin(
          ['Day', 'Rolls', 'Source'],
          series.map((point) => [point.day, point.value, point.frozen ? 'snapshot' : 'live']),
          [1],
        ),
      caveatLine(metrics.rollsPerDay),
    ),

    card(
      'Game system signals',
      tag(metrics.systems),
      barChart(systems, 168) +
        `<div class="legend"><span><i style="background:var(--series-1)"></i>strong — a modifier or die makes the shape distinctive</span><span><i style="background:var(--de-emphasis)"></i>weak — the shape fits, but fits others too</span></div>` +
        twin(
          ['Signal', 'Confidence', 'Terms', 'Share'],
          metrics.systems.value.map((row) => [
            row.label,
            row.confidence,
            row.n,
            percent(row.share),
          ]),
          [2, 3],
        ),
      '<p class="muted">Constants are not recorded, so 4d6kh3 and 4d6kh1 arrive identical. These are signals, not detections.</p>',
    ),

    card(
      'Where the bot is used',
      tag(metrics.surfaces),
      stackedBar(surfaces) +
        `<div class="legend">${surfaces.map((segment) => `<span><i style="background:${segment.color}"></i>${esc(segment.label)}</span>`).join('')}</div>` +
        twin(
          ['Surface', 'Calls', 'Share'],
          metrics.surfaces.value.map((row) => [row.key, row.n, percent(row.share)]),
          [1, 2],
        ),
      '<p class="muted">Counts every invocation, including /help and /start — not only rolls.</p>' +
        caveatLine(metrics.surfaces),
    ),

    card(
      'Die sizes',
      tag(metrics.buckets),
      barChart(buckets, 60) +
        twin(
          ['Bucket', 'Points', 'Share'],
          metrics.buckets.value.map((row) => [row.key, row.n, percent(row.share)]),
          [1, 2],
        ),
    ),

    card(
      'Modifier adoption',
      tag(metrics.modifiers),
      `<p class="sub">${compact(modifiers.modified)} of ${compact(modifiers.total)} terms carry a modifier (${percent(modifiers.rate)}).</p>` +
        (tokens.length > 0
          ? barChart(tokens, 60)
          : '<p class="empty">No modifiers recorded in this window.</p>') +
        twin(
          ['Token', 'Terms', 'Share'],
          metrics.modifierTokens.value.map((row) => [row.token, row.n, percent(row.share)]),
          [1, 2],
        ),
    ),

    card(
      'Notation shapes',
      tag(metrics.notation),
      table(
        ['Term', 'Modifiers', 'Terms'],
        metrics.notation.value.slice(0, 20).map((row) => [row.term, row.modifiers || '—', row.n]),
        [2],
      ),
    ),

    card(
      'Users',
      tag(metrics.users),
      `<p class="sub">${cohort('D1 return', users.cohorts.d1)} · ${cohort('D7 return', users.cohorts.d7)}</p>` +
        (users.firstDay
          ? `<p class="warn">! users first seen on ${esc(users.firstDay)} may have rolled before the window opened, so they are excluded from the cohorts</p>`
          : '') +
        table(
          ['Top share', 'Users', 'Of all rolls'],
          users.concentration.map((row) => [`top ${row.percent}%`, row.users, percent(row.share)]),
          [1, 2],
        ) +
        twin(
          ['Active days', 'Users'],
          users.activityHistogram.map((row) => [row.activeDays, row.users]),
          [0, 1],
        ),
      caveatLine(metrics.users),
    ),

    '</main>',
  ];

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>rollrobot analytics</title>',
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    body.join(''),
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

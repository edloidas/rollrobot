import type { AnalyticsClient } from './client';
import {
  type Adoption,
  type Grouped,
  groupBy,
  modifierAdoption,
  modifierTokens,
  type SystemShare,
  systemMix,
  termsPerRoll,
  type TokenShare,
  type UserStats,
  userStats,
} from './derive';
import {
  type CommandSurface,
  type DayCount,
  fetchBuckets,
  fetchCommandSurface,
  fetchNotation,
  fetchPointsPerDay,
  fetchRollsPerDay,
  fetchTotals,
  fetchUserDays,
  type Pair,
  type Precision,
  PRECISION_NOTES,
  type Totals,
  USER_DAY_LIMIT,
} from './queries';

/** Every figure carries the reason it might be wrong, next to the figure. */
export interface Metric<Value> {
  precision: Precision;
  caveat?: string;
  value: Value;
}

export interface Report {
  generatedAt: string;
  window: Totals & { days: number };
  precisionNotes: Record<Precision, string>;
  warnings: string[];
  metrics: {
    pointsPerDay: Metric<DayCount[]>;
    rollsPerDay: Metric<DayCount[]>;
    termsPerRoll: Metric<number>;
    buckets: Metric<Grouped[]>;
    systems: Metric<SystemShare[]>;
    notation: Metric<Pair[]>;
    modifiers: Metric<Adoption>;
    modifierTokens: Metric<TokenShare[]>;
    commands: Metric<Grouped[]>;
    surfaces: Metric<Grouped[]>;
    commandSurface: Metric<CommandSurface[]>;
    users: Metric<UserStats>;
  };
}

const INLINE_CAVEAT =
  'inline rolls are undercounted: chosen_inline_result delivery is probabilistic, set by BotFather /setinlinefeedback';

/** The BotFather setting is not readable over the API, so it has to be declared. */
export function inlineCaveat(): string {
  const configured = process.env.INLINE_FEEDBACK_PROBABILITY;
  return configured
    ? `${INLINE_CAVEAT} (configured: ${configured})`
    : `${INLINE_CAVEAT} — set INLINE_FEEDBACK_PROBABILITY to record the configured value`;
}

/**
 * Every way this data misleads, stated before any figure is read. Printed on every
 * command, not just the report, because `quota` shows sampled counts too.
 */
export function preamble(): string {
  return [
    'Caveats:',
    ...Object.entries(PRECISION_NOTES).map(([key, note]) => `  ${key}: ${note}`),
    `  inline: ${inlineCaveat()}`,
  ].join('\n');
}

export async function buildReport(client: AnalyticsClient, days: number): Promise<Report> {
  const [totals, pointsPerDay, rollsPerDay, notation, commandSurface, buckets, userDays] =
    await Promise.all([
      fetchTotals(client, days),
      fetchPointsPerDay(client, days),
      fetchRollsPerDay(client, days),
      fetchNotation(client, days),
      fetchCommandSurface(client, days),
      fetchBuckets(client, days),
      fetchUserDays(client, days),
    ]);

  const warnings: string[] = [];
  if (userDays.length >= USER_DAY_LIMIT) {
    warnings.push(`user grid truncated at ${USER_DAY_LIMIT} rows — user figures are incomplete`);
  }

  const termPoints = notation.reduce((total, pair) => total + pair.n, 0);
  const rollPoints = rollsPerDay.reduce((total, day) => total + day.n, 0);

  return {
    generatedAt: new Date().toISOString(),
    window: { ...totals, days },
    precisionNotes: PRECISION_NOTES,
    warnings,
    metrics: {
      // Grouping by day is not grouping by the index, so the correction is not exact
      pointsPerDay: { precision: 'estimated', value: pointsPerDay },
      rollsPerDay: { precision: 'estimated', caveat: inlineCaveat(), value: rollsPerDay },
      termsPerRoll: { precision: 'estimated', value: termsPerRoll(termPoints, rollPoints) },
      buckets: {
        precision: 'exact',
        value: groupBy(
          buckets,
          (row) => row.bucket,
          (row) => row.n,
        ),
      },
      systems: { precision: 'estimated', value: systemMix(notation) },
      notation: { precision: 'estimated', value: notation },
      modifiers: { precision: 'estimated', value: modifierAdoption(notation) },
      modifierTokens: { precision: 'estimated', value: modifierTokens(notation) },
      commands: {
        precision: 'estimated',
        caveat: inlineCaveat(),
        value: groupBy(
          commandSurface,
          (row) => row.command,
          (row) => row.n,
        ),
      },
      surfaces: {
        precision: 'estimated',
        caveat: inlineCaveat(),
        value: groupBy(
          commandSurface,
          (row) => row.surface,
          (row) => row.n,
        ),
      },
      commandSurface: { precision: 'estimated', value: commandSurface },
      users: {
        precision: 'lower bound',
        // `since()` cuts at now minus N days, so the window opens on that calendar day
        value: userStats(userDays, {
          windowStart: new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10),
        }),
      },
    },
  };
}

//
// * Rendering
//

const NOTATION_LIMIT = 20;

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function table(columns: string[], rows: (string | number)[][]): string {
  if (rows.length === 0) return '  (no rows)';

  const cells = rows.map((row) => row.map(String));
  const widths = columns.map((column, index) =>
    Math.max(column.length, ...cells.map((row) => row[index]?.length ?? 0)),
  );

  // Numeric columns right-align; the first column is always the label
  const alignRight = columns.map(
    (_, index) => index > 0 && cells.every((row) => /^[\d.,%]+$/.test(row[index] ?? '')),
  );
  const line = (row: string[]) =>
    `  ${row
      .map((cell, index) =>
        alignRight[index] ? cell.padStart(widths[index]) : cell.padEnd(widths[index]),
      )
      .join('  ')
      .trimEnd()}`;

  return [line(columns), line(widths.map((width) => '-'.repeat(width))), ...cells.map(line)].join(
    '\n',
  );
}

function heading(title: string, metric: Metric<unknown>): string {
  const caveat = metric.caveat ? `\n  ! ${metric.caveat}` : '';
  return `\n${title}  [${metric.precision}]${caveat}`;
}

/** An empty cohort is unmeasured, not a zero — the window is younger than the return period. */
function returnRate(cohort: { eligible: number; rate: number }): string {
  return cohort.eligible === 0
    ? 'n/a (no cohort old enough yet)'
    : `${percent(cohort.rate)} of ${cohort.eligible}`;
}

function shares(rows: Grouped[]): (string | number)[][] {
  return rows.map((row) => [row.key, row.n, percent(row.share)]);
}

export function renderReport(report: Report): string {
  const { window, metrics, warnings } = report;
  const out: string[] = [];

  out.push(
    `rollrobot analytics — last ${window.days} days`,
    `  ${window.first || 'no data'} .. ${window.last || ''}`,
    `  ${window.rows} sampled rows, ${window.points} estimated data points`,
    '',
    preamble(),
  );

  if (warnings.length > 0) out.push('', ...warnings.map((warning) => `! ${warning}`));

  out.push(
    heading('Game system signals', metrics.systems),
    '  weak = the shape fits the system but fits others too; constants are not recorded',
    table(
      ['signal', 'confidence', 'terms', 'share'],
      metrics.systems.value.map((row) => [row.label, row.confidence, row.n, percent(row.share)]),
    ),
  );

  const modifiers = metrics.modifiers.value;
  out.push(
    heading('Modifier adoption', metrics.modifiers),
    `  ${modifiers.modified} of ${modifiers.total} terms carry a modifier (${percent(modifiers.rate)})`,
    table(
      ['token', 'terms', 'share'],
      metrics.modifierTokens.value.map((row) => [row.token, row.n, percent(row.share)]),
    ),
  );

  out.push(
    heading(`Notation shapes (top ${NOTATION_LIMIT})`, metrics.notation),
    table(
      ['term', 'modifiers', 'terms'],
      metrics.notation.value
        .slice(0, NOTATION_LIMIT)
        .map((row) => [row.term, row.modifiers || '-', row.n]),
    ),
  );

  out.push(
    heading('Die sizes', metrics.buckets),
    table(['bucket', 'points', 'share'], shares(metrics.buckets.value)),
  );

  out.push(
    heading('Commands', metrics.commands),
    table(['command', 'calls', 'share'], shares(metrics.commands.value)),
    heading('Surfaces', metrics.surfaces),
    table(['surface', 'calls', 'share'], shares(metrics.surfaces.value)),
  );

  out.push(
    heading('Activity', metrics.rollsPerDay),
    `  ${metrics.termsPerRoll.value.toFixed(2)} dice terms per roll`,
    table(
      // "rolling users", not active users — /help and /start are excluded from the grid
      ['day', 'rolls', 'points', 'rolling users', 'first seen'],
      metrics.rollsPerDay.value.map((row) => [
        row.day,
        row.n,
        metrics.pointsPerDay.value.find((point) => point.day === row.day)?.n ?? 0,
        metrics.users.value.activePerDay.find((day) => day.day === row.day)?.n ?? 0,
        // The opening day has no measurable acquisition count — see firstSeenPerDay
        metrics.users.value.firstSeenPerDay.find((day) => day.day === row.day)?.n ?? '-',
      ]),
    ),
  );

  const users = metrics.users.value;
  out.push(
    heading('Users', metrics.users),
    `  ${users.observedUsers} users observed rolling, D1 return ${returnRate(users.cohorts.d1)}, D7 return ${returnRate(users.cohorts.d7)}`,
    users.firstDay
      ? `  ! users first seen on ${users.firstDay} may have rolled before the window opened`
      : '',
    table(
      ['active days', 'users'],
      users.activityHistogram.map((row) => [row.activeDays, row.users]),
    ),
    '',
    table(
      ['top share', 'users', 'of all rolls'],
      users.concentration.map((row) => [`top ${row.percent}%`, row.users, percent(row.share)]),
    ),
    '',
    table(
      ['user', 'rolls', 'active days'],
      users.topUsers.map((row) => [row.user.slice(0, 12), row.rolls, row.activeDays]),
    ),
  );

  return `${out.join('\n')}\n`;
}

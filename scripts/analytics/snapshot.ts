import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import type { AnalyticsClient } from './client';
import {
  fetchDailyBuckets,
  fetchDailyCommandSurface,
  fetchDailyNotation,
  fetchPointsPerDay,
  fetchRollsPerDay,
  fetchUserDays,
  USER_DAY_LIMIT,
} from './queries';

export const SNAPSHOT_DIR = '.analytics';

/** Analytics Engine keeps 92 days, so that is the whole reachable history. */
export const RETENTION_DAYS = 92;

/** How long a finished day is left to settle before it is frozen for good. */
export const INGEST_BUFFER_DAYS = 2;

/**
 * A day's aggregates, frozen. Carries no `blob5` — user counts survive as
 * totals, individual users do not.
 */
export interface DaySnapshot {
  day: string;
  capturedAt: string;
  points: number;
  rolls: number;
  observedUsers: number;
  commands: Record<string, number>;
  surfaces: Record<string, number>;
  buckets: Record<string, number>;
  notation: { term: string; modifiers: string; n: number }[];
}

function tally<Row>(rows: Row[], key: (row: Row) => string, n: (row: Row) => number) {
  const totals: Record<string, number> = {};
  for (const row of rows) totals[key(row)] = (totals[key(row)] ?? 0) + n(row);
  return totals;
}

function bucketByDay<Row extends { day: string }>(rows: Row[]): Map<string, Row[]> {
  const byDay = new Map<string, Row[]>();
  for (const row of rows) {
    const existing = byDay.get(row.day);
    if (existing) existing.push(row);
    else byDay.set(row.day, [row]);
  }
  return byDay;
}

function utcDay(offsetDays = 0): string {
  return new Date(Date.now() - offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function addDays(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
}

/**
 * A day is frozen only once its stored aggregate can no longer move, which is a
 * day later than the day itself ending: data points are not queryable the instant
 * they are written, so a run just after midnight would miss the last rolls of the
 * day it is freezing. `INGEST_BUFFER_DAYS` buys that slack, and costs a day of lag.
 *
 * Days nobody used are frozen too — once retention passes, a gap left unwritten is
 * indistinguishable from a day that was never captured.
 *
 * Both bounds derive from the caller's `today`, taken before any query ran. Reading
 * the clock again here would let a run that straddles midnight freeze a day its own
 * fetches read as current. The oldest day is dropped because the rolling window cuts
 * at `now() - 92 days` mid-afternoon, so its morning is already missing.
 */
export function completeDays(observed: string[], today: string): string[] {
  const clipped = addDays(today, -RETENTION_DAYS);
  const settled = addDays(today, -INGEST_BUFFER_DAYS);
  const start = observed.filter((day) => day > clipped).sort()[0];
  if (start == null) return [];

  const days: string[] = [];
  for (let day = start; day < settled; day = addDays(day, 1)) days.push(day);
  return days;
}

function existingDays(): Set<string> {
  if (!existsSync(SNAPSHOT_DIR)) return new Set();

  return new Set(
    readdirSync(SNAPSHOT_DIR)
      .filter((name) => name.endsWith('.json') && !name.endsWith('.partial'))
      .map((name) => name.slice(0, -'.json'.length)),
  );
}

function tallyOf(value: unknown): Record<string, number> {
  if (value == null || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, n]) => [key, Number(n) || 0]),
  );
}

/**
 * Every frozen day on disk, oldest first. The only history that outlives the
 * 92-day retention window, so a reader that wants more than the live window has
 * to come through here.
 *
 * ! Numbers are coerced rather than trusted. These files are edited by hand and
 *   survive across versions, and a string reaching a renderer would be formatted
 *   and emitted as-is instead of being measured.
 */
export function readSnapshots(): DaySnapshot[] {
  return [...existingDays()].sort().map((day) => {
    const raw = JSON.parse(
      readFileSync(`${SNAPSHOT_DIR}/${day}.json`, 'utf8'),
    ) as Partial<DaySnapshot>;

    return {
      day,
      capturedAt: String(raw.capturedAt ?? ''),
      points: Number(raw.points) || 0,
      rolls: Number(raw.rolls) || 0,
      observedUsers: Number(raw.observedUsers) || 0,
      commands: tallyOf(raw.commands),
      surfaces: tallyOf(raw.surfaces),
      buckets: tallyOf(raw.buckets),
      notation: (Array.isArray(raw.notation) ? raw.notation : []).map((entry) => ({
        term: String(entry?.term ?? ''),
        modifiers: String(entry?.modifiers ?? ''),
        n: Number(entry?.n) || 0,
      })),
    };
  });
}

export interface SnapshotOutcome {
  written: string[];
  skipped: string[];
  /** Observed days deliberately not frozen — today, and the clipped oldest day. */
  pending: string[];
}

/**
 * Freezes every complete day not already on disk. Idempotent: a day is written
 * once and never revisited, so a re-run after new traffic cannot rewrite history.
 */
export async function writeSnapshots(client: AnalyticsClient): Promise<SnapshotOutcome> {
  const days = RETENTION_DAYS;
  const today = utcDay();
  const [points, rolls, commandSurface, buckets, notation, userDays] = await Promise.all([
    fetchPointsPerDay(client, days),
    fetchRollsPerDay(client, days),
    fetchDailyCommandSurface(client, days),
    fetchDailyBuckets(client, days),
    fetchDailyNotation(client, days),
    fetchUserDays(client, days),
  ]);

  // ! The day-partitioned fetches refuse truncation themselves. This one is shared
  //   with the report, where a truncated grid is a warning rather than a failure —
  //   but a snapshot is written once, so here it has to stop the run.
  if (userDays.length >= USER_DAY_LIMIT) {
    throw new Error(
      `User grid hit its ${USER_DAY_LIMIT}-row limit; snapshots would be incomplete. Query a narrower window.`,
    );
  }

  const rollsByDay = new Map(rolls.map((row) => [row.day, row.n]));
  const commandsByDay = bucketByDay(commandSurface);
  const bucketsByDay = bucketByDay(buckets);
  const notationByDay = bucketByDay(notation);
  const usersByDay = bucketByDay(userDays);

  const capturedAt = new Date().toISOString();
  const already = existingDays();
  const outcome: SnapshotOutcome = { written: [], skipped: [], pending: [] };

  const complete = completeDays(
    points.map((row) => row.day),
    today,
  );
  const frozen = new Set(complete);
  outcome.pending = points
    .map((row) => row.day)
    .filter((day) => !frozen.has(day))
    .sort();

  for (const day of complete) {
    if (already.has(day)) {
      outcome.skipped.push(day);
      continue;
    }

    const surfaceRows = commandsByDay.get(day) ?? [];
    const snapshot: DaySnapshot = {
      day,
      capturedAt,
      points: points.find((row) => row.day === day)?.n ?? 0,
      rolls: rollsByDay.get(day) ?? 0,
      observedUsers: new Set((usersByDay.get(day) ?? []).map((row) => row.user)).size,
      commands: tally(
        surfaceRows,
        (row) => row.command,
        (row) => row.n,
      ),
      surfaces: tally(
        surfaceRows,
        (row) => row.surface,
        (row) => row.n,
      ),
      buckets: tally(
        bucketsByDay.get(day) ?? [],
        (row) => row.bucket,
        (row) => row.n,
      ),
      notation: (notationByDay.get(day) ?? [])
        .map(({ term, modifiers, n }) => ({ term, modifiers, n }))
        .sort((a, b) => b.n - a.n),
    };

    // ! Written aside then renamed: a kill mid-write would otherwise leave a
    //   truncated file that the next run counts as already captured.
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const target = `${SNAPSHOT_DIR}/${day}.json`;
    const staged = `${target}.partial`;
    await Bun.write(staged, `${JSON.stringify(snapshot, null, 2)}\n`);
    renameSync(staged, target);
    outcome.written.push(day);
  }

  return outcome;
}

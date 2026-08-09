import { type AnalyticsClient, DATASET } from './client';

/**
 * How far a figure can be trusted. Every table in the report is tagged with one,
 * because the three failure modes are invisible in the numbers themselves.
 */
export type Precision = 'exact' | 'estimated' | 'lower bound';

export const PRECISION_NOTES: Record<Precision, string> = {
  exact: 'sample-corrected along the dataset index (index1), where the correction is lossless',
  estimated: 'sample-corrected off the index, so totals drift against each other (+10% measured)',
  'lower bound': 'distinct counts see only sampled rows, and no weighted-distinct function exists',
};

// `double1 = 0` marks the first term of an invocation, so it yields one row per
// call; `blob2` is empty only for /help and /start, which record no dice.
const INVOCATIONS = 'double1 = 0';
const ROLLS = "double1 = 0 AND blob2 != ''";
const TERMS = "blob2 != ''";

// An unset ANALYTICS_SALT writes an empty hash, which would otherwise collapse
// every un-attributable row into one phantom user.
const IDENTIFIED = "blob5 != ''";

// ! Bounds an unbounded GROUP BY. The sort is by day, so hitting this drops the
//   most recent days whole. Callers must treat reaching it as a failure, not a tail.
export const USER_DAY_LIMIT = 100_000;

/** The API rejects bare string comparison against `timestamp`. */
function since(days: number): string {
  return `timestamp >= now() - INTERVAL '${days}' DAY`;
}

function where(...clauses: string[]): string {
  return `WHERE ${clauses.join(' AND ')}`;
}

function count(row: Record<string, unknown> | undefined, key: string): number {
  return Number(row?.[key] ?? 0);
}

export interface Totals {
  rows: number;
  points: number;
  first: string;
  last: string;
}

export interface DayCount {
  day: string;
  n: number;
}

export interface Pair {
  term: string;
  modifiers: string;
  n: number;
}

export interface CommandSurface {
  command: string;
  surface: string;
  n: number;
}

export interface BucketCount {
  bucket: string;
  n: number;
}

export interface UserDay {
  day: string;
  user: string;
  rolls: number;
}

export async function fetchTotals(client: AnalyticsClient, days: number): Promise<Totals> {
  const [row] = await client.query<Record<string, string>>(`
    SELECT count() AS rows, SUM(_sample_interval) AS points,
           min(timestamp) AS first, max(timestamp) AS last
    FROM ${DATASET} ${where(since(days))}
  `);

  return {
    rows: count(row, 'rows'),
    points: count(row, 'points'),
    first: row?.first ?? '',
    last: row?.last ?? '',
  };
}

/** Every data point per day — the figure the 100k/day allowance is measured against. */
export async function fetchPointsPerDay(
  client: AnalyticsClient,
  days: number,
): Promise<DayCount[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days))}
    GROUP BY day ORDER BY day
  `);

  return rows.map((row) => ({ day: row.day, n: count(row, 'n') }));
}

export async function fetchRollsPerDay(client: AnalyticsClient, days: number): Promise<DayCount[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days), ROLLS)}
    GROUP BY day ORDER BY day
  `);

  return rows.map((row) => ({ day: row.day, n: count(row, 'n') }));
}

/**
 * One row per distinct dice shape. Feeds the notation table, the system-signal
 * mix and the modifier-adoption rate — all three read the same fetch.
 */
export async function fetchNotation(client: AnalyticsClient, days: number): Promise<Pair[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT blob2 AS term, blob3 AS modifiers, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days), TERMS)}
    GROUP BY term, modifiers ORDER BY n DESC
  `);

  return rows.map((row) => ({ term: row.term, modifiers: row.modifiers, n: count(row, 'n') }));
}

/** Covers /help and /start too, which is why it filters on invocations, not rolls. */
export async function fetchCommandSurface(
  client: AnalyticsClient,
  days: number,
): Promise<CommandSurface[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT blob1 AS command, blob4 AS surface, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days), INVOCATIONS)}
    GROUP BY command, surface ORDER BY n DESC
  `);

  return rows.map((row) => ({ command: row.command, surface: row.surface, n: count(row, 'n') }));
}

/** `index1` holds the command name for /help and /start, which record no dice. */
const DIE_BUCKETS = new Set(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'dF', 'other']);

/**
 * The only aggregation the sampling correction is exact for. Non-dice buckets are
 * dropped afterwards rather than in the `WHERE`, because filtering off the index
 * is what costs the correction its exactness.
 */
export async function fetchBuckets(client: AnalyticsClient, days: number): Promise<BucketCount[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT index1 AS bucket, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days))}
    GROUP BY bucket ORDER BY n DESC
  `);

  return rows
    .filter((row) => DIE_BUCKETS.has(row.bucket))
    .map((row) => ({ bucket: row.bucket, n: count(row, 'n') }));
}

/**
 * The (day, user) grid every user-facing figure is derived from — active users,
 * cohorts, return rates and concentration all fall out of it client-side, which
 * keeps them off the SQL subset's limited function set.
 */
export async function fetchUserDays(client: AnalyticsClient, days: number): Promise<UserDay[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, blob5 AS user, SUM(_sample_interval) AS rolls
    FROM ${DATASET} ${where(since(days), ROLLS, IDENTIFIED)}
    GROUP BY day, user ORDER BY day
    LIMIT ${USER_DAY_LIMIT}
  `);

  return rows.map((row) => ({ day: row.day, user: row.user, rolls: count(row, 'rolls') }));
}

//
// * Day-partitioned fetches
//
// The report aggregates across its whole window; snapshots need the same cuts
// resolved per day, because a day that falls out of retention cannot be re-cut.

export interface DailyCommandSurface extends CommandSurface {
  day: string;
}

export interface DailyBucket extends BucketCount {
  day: string;
}

export interface DailyPair extends Pair {
  day: string;
}

// ! Bounds an unbounded GROUP BY. The sort is global, not per day, so hitting this
//   drops the rarest shapes wherever they fall — which can be every row of a quiet
//   day. Callers that persist the result must treat reaching it as a failure.
export const DAILY_NOTATION_LIMIT = 20_000;

// ! Low-cardinality by construction (commands x surfaces x days, buckets x days), but
//   stated rather than left to the API's default cap — these feed write-once
//   snapshots, and an implicit cap sorted by day would drop the newest days whole.
export const DAILY_DIMENSION_LIMIT = 50_000;

/**
 * These three feed snapshots, which are written once and never revisited, so a
 * truncated result must stop the run rather than be frozen. Checked on the raw rows:
 * a caller filtering the result afterwards would no longer be able to tell.
 */
function refuseTruncated(rows: unknown[], limit: number, what: string): void {
  if (rows.length >= limit) {
    throw new Error(
      `${what} hit its ${limit}-row limit; the result is missing days. Query a narrower window.`,
    );
  }
}

export async function fetchDailyCommandSurface(
  client: AnalyticsClient,
  days: number,
): Promise<DailyCommandSurface[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, blob1 AS command, blob4 AS surface, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days), INVOCATIONS)}
    GROUP BY day, command, surface ORDER BY day
    LIMIT ${DAILY_DIMENSION_LIMIT}
  `);

  refuseTruncated(rows, DAILY_DIMENSION_LIMIT, 'Daily command/surface fetch');

  return rows.map((row) => ({
    day: row.day,
    command: row.command,
    surface: row.surface,
    n: count(row, 'n'),
  }));
}

export async function fetchDailyBuckets(
  client: AnalyticsClient,
  days: number,
): Promise<DailyBucket[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, index1 AS bucket, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days))}
    GROUP BY day, bucket ORDER BY day
    LIMIT ${DAILY_DIMENSION_LIMIT}
  `);

  refuseTruncated(rows, DAILY_DIMENSION_LIMIT, 'Daily bucket fetch');

  return rows
    .filter((row) => DIE_BUCKETS.has(row.bucket))
    .map((row) => ({ day: row.day, bucket: row.bucket, n: count(row, 'n') }));
}

export async function fetchDailyNotation(
  client: AnalyticsClient,
  days: number,
): Promise<DailyPair[]> {
  const rows = await client.query<Record<string, string>>(`
    SELECT toDate(timestamp) AS day, blob2 AS term, blob3 AS modifiers, SUM(_sample_interval) AS n
    FROM ${DATASET} ${where(since(days), TERMS)}
    GROUP BY day, term, modifiers ORDER BY n DESC
    LIMIT ${DAILY_NOTATION_LIMIT}
  `);

  refuseTruncated(rows, DAILY_NOTATION_LIMIT, 'Daily notation fetch');

  return rows.map((row) => ({
    day: row.day,
    term: row.term,
    modifiers: row.modifiers,
    n: count(row, 'n'),
  }));
}

/** Raw rows, newest first — the write-path health check, not an analysis input. */
export async function fetchLatestRows(
  client: AnalyticsClient,
  limit: number,
): Promise<Record<string, string>[]> {
  return client.query<Record<string, string>>(`
    SELECT timestamp, index1, blob1, blob2, blob3, blob4, blob5, double1
    FROM ${DATASET} ORDER BY timestamp DESC LIMIT ${limit}
  `);
}

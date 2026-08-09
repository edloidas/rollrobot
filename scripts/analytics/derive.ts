import type { DayCount, Pair, UserDay } from './queries';
import { classify } from './systems';

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` to a whole-day index, so cohort arithmetic stays integer. */
function dayIndex(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

function share(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export interface SystemShare {
  id: string;
  label: string;
  confidence: 'strong' | 'weak';
  n: number;
  share: number;
}

/** Collapses dice shapes onto system signals, ordered by weight. */
export function systemMix(pairs: Pair[]): SystemShare[] {
  const totals = new Map<string, SystemShare>();

  for (const pair of pairs) {
    const { id, label, confidence } = classify(pair.term, pair.modifiers);
    const entry = totals.get(id) ?? { id, label, confidence, n: 0, share: 0 };
    entry.n += pair.n;
    totals.set(id, entry);
  }

  const total = sum(pairs.map((pair) => pair.n));
  return [...totals.values()]
    .map((entry) => ({ ...entry, share: share(entry.n, total) }))
    .sort((a, b) => b.n - a.n);
}

export interface Adoption {
  modified: number;
  total: number;
  rate: number;
}

/** The share of dice terms carrying any modifier — whether the parser earns its keep. */
export function modifierAdoption(pairs: Pair[]): Adoption {
  const total = sum(pairs.map((pair) => pair.n));
  const modified = sum(pairs.filter((pair) => pair.modifiers !== '').map((pair) => pair.n));

  return { modified, total, rate: share(modified, total) };
}

export interface TokenShare {
  token: string;
  n: number;
  share: number;
}

/**
 * Per-token adoption. A term with `kh,!` counts once toward each, and a term
 * whose tree repeats a token — `(4d6kh3)kh2` records `kh,kh` — still counts once,
 * which keeps every share a fraction of the term total.
 */
export function modifierTokens(pairs: Pair[]): TokenShare[] {
  const totals = new Map<string, number>();

  for (const pair of pairs) {
    if (pair.modifiers === '') continue;
    for (const token of new Set(pair.modifiers.split(','))) {
      totals.set(token, (totals.get(token) ?? 0) + pair.n);
    }
  }

  const total = sum(pairs.map((pair) => pair.n));
  return [...totals]
    .map(([token, n]) => ({ token, n, share: share(n, total) }))
    .sort((a, b) => b.n - a.n);
}

export interface Concentration {
  percent: number;
  users: number;
  share: number;
}

export interface Cohorts {
  d1: { eligible: number; returned: number; rate: number };
  d7: { eligible: number; returned: number; rate: number };
}

export interface UserStats {
  observedUsers: number;
  /**
   * Set only when the grid opens on the window edge, where a first sighting may not
   * be a first roll. `null` once the opening day is safely inside the window.
   */
  firstDay: string | null;
  activePerDay: DayCount[];
  /**
   * Users whose first roll in the grid landed on that day. The window's own first
   * day is omitted: every user is new to a window on its opening day, so the figure
   * there would be the active count restated, not an acquisition count.
   */
  firstSeenPerDay: DayCount[];
  activityHistogram: { activeDays: number; users: number }[];
  concentration: Concentration[];
  cohorts: Cohorts;
  topUsers: { user: string; rolls: number; activeDays: number }[];
}

const CONCENTRATION_PERCENTS = [1, 5, 10];

export interface UserStatsOptions {
  /**
   * Last day whose outcome is fully observed, `YYYY-MM-DD`. Defaults to yesterday,
   * UTC — today is still running, so a user first seen yesterday has not yet had a
   * full day in which to return.
   */
  asOf?: string;
  /**
   * First day the window covers, `YYYY-MM-DD`. When the first day anyone rolled is
   * strictly later, that day is a real acquisition day rather than a window edge.
   */
  windowStart?: string;
  topCount?: number;
}

function utcDay(offsetDays = 0): string {
  return new Date(Date.now() - offsetDays * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Everything user-shaped, derived from the (day, user) grid in one pass.
 *
 * Every figure here is a lower bound: a user whose only roll was sampled away
 * is invisible, and no weighted-distinct function exists to correct for it.
 */
export function userStats(userDays: UserDay[], options: UserStatsOptions = {}): UserStats {
  const { asOf = utcDay(1), windowStart, topCount = 20 } = options;
  const days = new Map<string, Set<string>>();
  const rolls = new Map<string, number>();
  const activeDays = new Map<string, Set<number>>();
  const firstSeen = new Map<string, number>();

  for (const { day, user, rolls: n } of userDays) {
    const index = dayIndex(day);

    days.set(day, (days.get(day) ?? new Set()).add(user));
    rolls.set(user, (rolls.get(user) ?? 0) + n);
    activeDays.set(user, (activeDays.get(user) ?? new Set()).add(index));

    const seen = firstSeen.get(user);
    if (seen == null || index < seen) firstSeen.set(user, index);
  }

  const orderedDays = [...days.keys()].sort();

  const activePerDay = orderedDays.map((day) => ({ day, n: days.get(day)?.size ?? 0 }));

  // Only an opening day that sits on the window edge is unmeasurable. If nobody
  // rolled until later, that later day is a genuine acquisition day. An unstated
  // window is assumed clipped — that can understate acquisition, never overstate it.
  const clipped = orderedDays[0] != null && (windowStart == null || orderedDays[0] <= windowStart);
  const measurableDays = clipped ? orderedDays.slice(1) : orderedDays;
  const firstSeenPerDay = measurableDays.map((day) => ({
    day,
    n: [...(days.get(day) ?? [])].filter((user) => firstSeen.get(user) === dayIndex(day)).length,
  }));

  const histogram = new Map<number, number>();
  for (const seen of activeDays.values()) {
    histogram.set(seen.size, (histogram.get(seen.size) ?? 0) + 1);
  }

  const ranked = [...rolls.entries()].sort((a, b) => b[1] - a[1]);
  const totalRolls = sum(ranked.map(([, n]) => n));
  const concentration = CONCENTRATION_PERCENTS.map((percent) => {
    const users = Math.min(ranked.length, Math.max(1, Math.ceil((ranked.length * percent) / 100)));
    return {
      percent,
      users,
      share: share(sum(ranked.slice(0, users).map(([, n]) => n)), totalRolls),
    };
  });

  return {
    observedUsers: rolls.size,
    firstDay: clipped ? (orderedDays[0] ?? null) : null,
    activePerDay,
    firstSeenPerDay,
    activityHistogram: [...histogram]
      .map(([count, users]) => ({ activeDays: count, users }))
      .sort((a, b) => a.activeDays - b.activeDays),
    concentration,
    cohorts: cohorts(
      firstSeen,
      activeDays,
      dayIndex(asOf),
      clipped ? dayIndex(orderedDays[0]) : null,
    ),
    topUsers: ranked.slice(0, topCount).map(([user, n]) => ({
      user,
      rolls: n,
      activeDays: activeDays.get(user)?.size ?? 0,
    })),
  };
}

/**
 * Return rates over cohorts old enough to have had the chance. A user first seen
 * yesterday cannot yet have a D7 outcome, so counting them would drag the rate
 * toward zero as a pure artifact of the window edge.
 *
 * Eligibility runs to `asOf`, not to the last day anyone rolled — a silent bot
 * still observed the users who did not come back.
 *
 * `clippedDay` drops the cohort whose first sighting is the window's own opening
 * day. Those users were not acquired then, they were merely seen first — counting
 * them would turn the rate into day-over-day activity, and would make it move with
 * `--days` on unchanged data.
 */
function cohorts(
  firstSeen: Map<string, number>,
  activeDays: Map<string, Set<number>>,
  asOf: number,
  clippedDay: number | null,
): Cohorts {
  const measure = (window: number) => {
    let eligible = 0;
    let returned = 0;

    for (const [user, start] of firstSeen) {
      if (start === clippedDay) continue;
      if (start + window > asOf) continue;
      eligible += 1;

      const seen = activeDays.get(user);
      for (let offset = 1; offset <= window; offset += 1) {
        if (seen?.has(start + offset)) {
          returned += 1;
          break;
        }
      }
    }

    return { eligible, returned, rate: share(returned, eligible) };
  };

  return { d1: measure(1), d7: measure(7) };
}

/**
 * Dice terms per roll — not data points per roll: the term total excludes /help and
 * /start, which write a point each. Reads high under sampling too, because the two
 * figures are filtered differently and their corrections drift against each other.
 */
export function termsPerRoll(termPoints: number, rollPoints: number): number {
  return rollPoints === 0 ? 0 : termPoints / rollPoints;
}

export interface Grouped {
  key: string;
  n: number;
  share: number;
}

/** Folds a two-dimensional fetch onto one of its axes. */
export function groupBy<Row>(
  rows: Row[],
  key: (row: Row) => string,
  n: (row: Row) => number,
): Grouped[] {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(key(row), (totals.get(key(row)) ?? 0) + n(row));

  const total = sum([...totals.values()]);
  return [...totals]
    .map(([label, count]) => ({ key: label, n: count, share: share(count, total) }))
    .sort((a, b) => b.n - a.n);
}

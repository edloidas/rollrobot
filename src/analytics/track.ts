import type { RollResult } from 'roll-parser';
import { hashUserId } from './hash';
import { type DiceTerm, shapeTerms } from './shape';

export interface AnalyticsDataPoint {
  indexes?: string[];
  blobs?: (string | null)[];
  doubles?: number[];
}

/**
 * The slice of Cloudflare's `AnalyticsEngineDataset` this Worker uses. Declared
 * locally because the project types against `bun-types` only.
 */
export interface AnalyticsEngineDataset {
  writeDataPoint(event: AnalyticsDataPoint): void;
}

export interface AnalyticsEnv {
  ANALYTICS?: AnalyticsEngineDataset;
  ANALYTICS_SALT?: string;
}

export type Command = 'roll' | 'full' | 'random' | 'ask' | 'pick' | 'inline' | 'help' | 'start';

export type Surface = 'private' | 'group' | 'supergroup' | 'channel' | 'inline' | 'unknown';

const CHAT_SURFACES: readonly string[] = ['private', 'group', 'supergroup', 'channel'];

export function resolveSurface(chatType: string | undefined): Surface {
  return CHAT_SURFACES.includes(chatType ?? '') ? (chatType as Surface) : 'unknown';
}

export interface TrackContext {
  command: Command;
  surface: Surface;
  userId?: number;
}

// ! Append-only. Rows carry no version marker, so reordering or repurposing a
//   slot silently blends incompatible meanings across the retention window.
function dataPoint(
  { command, surface }: TrackContext,
  userHash: string,
  term: DiceTerm | null,
): AnalyticsDataPoint {
  return {
    indexes: [term?.bucket ?? command],
    blobs: [command, term?.term ?? '', term?.modifiers ?? '', surface, userHash],
    doubles: [term?.index ?? 0],
  };
}

/** An empty salt is treated as absent — importing a zero-length HMAC key throws. */
async function userHashOf(env: AnalyticsEnv, userId: number | undefined): Promise<string> {
  if (!env.ANALYTICS_SALT || userId == null) return '';
  return hashUserId(env.ANALYTICS_SALT, userId);
}

/** A roll, or a thunk deriving one — the thunk runs behind the binding check and inside the guard. */
export type RollSource = RollResult | null | (() => RollResult | null);

/**
 * Records one data point per distinct dice term. Never throws: analytics must
 * not be able to break a reply, and the shape walk can fail on exotic notation.
 */
export async function trackRoll(
  env: AnalyticsEnv,
  context: TrackContext,
  source: RollSource,
): Promise<void> {
  if (env.ANALYTICS == null) return;

  try {
    const result = typeof source === 'function' ? source() : source;
    if (result == null) return;

    const terms = shapeTerms(result);
    if (terms.length === 0) return;

    const userHash = await userHashOf(env, context.userId);
    for (const term of terms) env.ANALYTICS.writeDataPoint(dataPoint(context, userHash, term));
  } catch (error) {
    console.error('Analytics error:', error instanceof Error ? error.message : error);
  }
}

/** Records a single data point for a command that rolls nothing. */
export async function trackCommand(env: AnalyticsEnv, context: TrackContext): Promise<void> {
  if (env.ANALYTICS == null) return;

  try {
    env.ANALYTICS.writeDataPoint(dataPoint(context, await userHashOf(env, context.userId), null));
  } catch (error) {
    console.error('Analytics error:', error instanceof Error ? error.message : error);
  }
}

import type { RollResult } from 'roll-parser';

/** A rendered reply and the roll behind it; `result` is `null` when the notation did not parse. */
export interface Reply {
  text: string;
  result: RollResult | null;
}

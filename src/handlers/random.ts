import { roll } from 'roll-parser';
import { formatTotal, withLabel } from '../format';
import type { Reply } from './reply';

export const RANDOM_NOTATION = 'd100';

export function randomReply(label?: string | null): Reply {
  const result = roll(RANDOM_NOTATION);
  return { text: withLabel(formatTotal(result), label), result };
}

import { isNotationError, roll } from 'roll-parser';
import { formatError, formatResult, withLabel } from '../format';
import { ROLL_LIMITS } from '../limits';
import type { Reply } from './reply';

export function rollReply(notation: string, label?: string | null): Reply {
  try {
    const result = roll(notation, ROLL_LIMITS);
    return { text: withLabel(formatResult(result), label), result };
  } catch (error) {
    if (isNotationError(error)) return { text: formatError(error, notation), result: null };
    throw error;
  }
}

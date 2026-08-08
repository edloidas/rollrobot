import { isNotationError, roll } from 'roll-parser';
import { formatError, formatResult, withLabel } from '../format';
import { ROLL_LIMITS } from '../limits';

export function rollReply(notation: string, label?: string | null): string {
  try {
    return withLabel(formatResult(roll(notation, ROLL_LIMITS)), label);
  } catch (error) {
    if (isNotationError(error)) return formatError(error, notation);
    throw error;
  }
}

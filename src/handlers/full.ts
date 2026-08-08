import { isNotationError, roll } from 'roll-parser';
import { formatDetailedResult, formatError, withLabel } from '../format';
import { ROLL_LIMITS } from '../limits';

export function fullReply(notation: string, label?: string | null): string {
  try {
    return withLabel(formatDetailedResult(roll(notation, ROLL_LIMITS)), label);
  } catch (error) {
    if (isNotationError(error)) return formatError(error, notation);
    throw error;
  }
}

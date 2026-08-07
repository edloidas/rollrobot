import { isNotationError, roll } from 'roll-parser';
import { formatError, formatResult } from '../format';
import { ROLL_LIMITS } from '../limits';

export function rollReply(notation: string): string {
  try {
    return formatResult(roll(notation, ROLL_LIMITS));
  } catch (error) {
    if (isNotationError(error)) return formatError(error, notation);
    throw error;
  }
}

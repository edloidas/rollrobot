import { isRollParserError, roll } from 'roll-parser';
import { formatDetailedResult, formatError } from '../format';
import { ROLL_LIMITS } from '../limits';

export function fullReply(notation: string): string {
  try {
    return formatDetailedResult(roll(notation, ROLL_LIMITS));
  } catch (error) {
    if (isRollParserError(error)) return formatError(error, notation);
    throw error;
  }
}

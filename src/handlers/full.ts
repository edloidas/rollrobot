import { isRollParserError, roll } from 'roll-parser';
import { ROLL_LIMITS } from '../limits';
import { createFullResultMessage, errorText } from '../text';

export function fullReply(notation: string): string {
  try {
    return createFullResultMessage(roll(notation, ROLL_LIMITS));
  } catch (error) {
    if (isRollParserError(error)) return errorText;
    throw error;
  }
}

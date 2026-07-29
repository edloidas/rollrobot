import { isRollParserError, roll } from 'roll-parser';
import { ROLL_LIMITS } from '../limits';
import { createResultMessage, errorText } from '../text';

export function rollReply(notation: string): string {
  try {
    return createResultMessage(roll(notation, ROLL_LIMITS));
  } catch (error) {
    if (isRollParserError(error)) return errorText;
    throw error;
  }
}

import { parse, roll } from 'roll-parser';
import { createFullResultMessage, errorText } from '../text';
import { limit } from '../limiter';

export function fullReply(notation: string): string {
  const result = roll(limit(parse(notation)));
  return createFullResultMessage(result) || errorText;
}

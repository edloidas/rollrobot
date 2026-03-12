import { parse, roll } from 'roll-parser';
import { createResultMessage, errorText } from '../text';
import { limit } from '../limiter';

export function rollReply(notation: string): string {
  const result = roll(limit(parse(notation)));
  return createResultMessage(result) || errorText;
}

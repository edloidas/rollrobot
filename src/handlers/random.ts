import { roll } from 'roll-parser';
import { formatResult } from '../format';

export function randomReply(): string {
  return formatResult(roll('d100'));
}

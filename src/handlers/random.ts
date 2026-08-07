import { roll } from 'roll-parser';
import { formatTotal } from '../format';

export function randomReply(): string {
  return formatTotal(roll('d100'));
}

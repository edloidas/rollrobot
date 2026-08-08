import { roll } from 'roll-parser';
import { formatTotal, withLabel } from '../format';

export function randomReply(label?: string | null): string {
  return withLabel(formatTotal(roll('d100')), label);
}

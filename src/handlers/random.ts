import { roll } from 'roll-parser';
import { createResultMessage } from '../text';

export function randomReply(): string {
  return createResultMessage(roll('d100'));
}

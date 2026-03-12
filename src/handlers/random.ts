import { parseAndRollSimple } from 'roll-parser';

export function randomReply(): string {
  const result = parseAndRollSimple('100');
  return `\`(${result.notation})\` *${result.value}*`;
}

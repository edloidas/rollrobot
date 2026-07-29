const BARE_NUMBER = /^\d+$/;
const SIMPLIFIED = /^(\d+)\s+(\d+)(?:\s+([+-]?\d+))?$/;

/**
 * Rewrites pre-v3 shorthand into dice notation: a bare number rolls a die
 * with that many sides (`20` → `d20`), and the space-separated simplified
 * form becomes classic notation (`2 10 -1` → `2d10-1`). Anything else is
 * passed through for the parser to judge. Empty input defaults to `d20`.
 */
export function normalizeNotation(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') return 'd20';

  if (BARE_NUMBER.test(trimmed)) return `d${trimmed}`;

  const match = trimmed.match(SIMPLIFIED);
  if (match == null) return trimmed;

  const [, count, dice, modifier] = match;
  if (modifier == null) return `${count}d${dice}`;

  const signed = /^[+-]/.test(modifier) ? modifier : `+${modifier}`;
  return `${count}d${dice}${signed}`;
}

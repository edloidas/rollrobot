const BARE_NUMBER = /^\d+$/;
const SIMPLIFIED = /^(\d+)\s+(\d+)(?:\s+([+-]?\d+))?$/;

const EASTERN_NUMERALS = /[٠-٩٪۰-۹]/g;

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;
const ARABIC_PERCENT = 0x066a;

/**
 * Folds Arabic-Indic (`٠`–`٩`), Extended Arabic-Indic (`۰`–`۹`) and the Arabic percent
 * sign (`٪`) to ASCII, which is all the parser's grammar accepts.
 *
 * ! Notation only. `extractLabel` runs first at every call site, so a roll named
 * `«ضربهٔ ۳»` keeps its own numerals — folding ahead of that split would renumber it.
 */
function foldNumerals(input: string): string {
  return input.replace(EASTERN_NUMERALS, (char) => {
    const code = char.charCodeAt(0);
    if (code === ARABIC_PERCENT) return '%';
    const zero = code < ARABIC_PERCENT ? ARABIC_INDIC_ZERO : EXTENDED_ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

/**
 * Rewrites pre-v3 shorthand into dice notation: a bare number rolls a die
 * with that many sides (`20` → `d20`), and the space-separated simplified
 * form becomes classic notation (`2 10 -1` → `2d10-1`). Anything else is
 * passed through for the parser to judge. Empty input defaults to `d20`.
 *
 * Eastern numerals are folded first, so the shorthand rules see `۲۰` as `20`.
 */
export function normalizeNotation(input: string): string {
  const trimmed = foldNumerals(input.trim());
  if (trimmed === '') return 'd20';

  if (BARE_NUMBER.test(trimmed)) return `d${trimmed}`;

  const match = trimmed.match(SIMPLIFIED);
  if (match == null) return trimmed;

  const [, count, dice, modifier] = match;
  if (modifier == null) return `${count}d${dice}`;

  const signed = /^[+-]/.test(modifier) ? modifier : `+${modifier}`;
  return `${count}d${dice}${signed}`;
}

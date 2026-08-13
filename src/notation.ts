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
 * Characters the parser rejects, mapped to the operator they were meant to be.
 *
 * The dash family is the one that matters: iOS and macOS rewrite `-` into `–` or `—`
 * without telling anyone, so `2d6 – 1` is an error the user cannot see the cause of.
 * `÷` and `×` are deliberate, but they sit on the same symbol page a phone offers
 * instead of `/` and `*`.
 *
 * ? Kept to what a keyboard or an autocorrect actually produces. Typographic curios
 * — `∗`, `·`, `‒`, the fullwidth forms — are errors nobody has hit.
 *
 * `к` (from «кубик») and its transliterated cousin `д` are how the Cyrillic locales
 * write a die — `2к6`, `к20`. Digits are shared across layouts, so the letter arrives
 * from the wrong alphabet unnoticed. Cyrillic `к` (U+043A) is not Latin `k` (U+006B),
 * so the `k` / `kh` / `kl` keep-modifiers are untouched.
 */
const CHARACTER_FOLDS: Record<string, string | undefined> = {
  '÷': '/',
  '×': '*',
  '−': '-',
  '–': '-',
  '—': '-',
  к: 'd',
  К: 'd',
  д: 'd',
  Д: 'd',
};

// Built from the keys so the two cannot drift apart. Safe as a character class only
// because no key is a `-`, `]` or `^`
const FOLDED = new RegExp(`[${Object.keys(CHARACTER_FOLDS).join('')}]`, 'g');

/**
 * Folds operator lookalikes to the ASCII the grammar accepts.
 *
 * ! Notation only, same as `foldNumerals` — `extractLabel` runs first at every call
 * site, and a label is prose where a `–` is a `–`.
 */
function foldCharacters(input: string): string {
  return input.replace(FOLDED, (char) => CHARACTER_FOLDS[char] ?? char);
}

/**
 * Rewrites pre-v3 shorthand into dice notation: a bare number rolls a die
 * with that many sides (`20` → `d20`), and the space-separated simplified
 * form becomes classic notation (`2 10 -1` → `2d10-1`). Anything else is
 * passed through for the parser to judge. Empty input defaults to `d20`.
 *
 * Characters are folded first, so the shorthand rules see `۲۰` as `20` and `۲ ۱۰ −۱`
 * as a signed modifier.
 */
export function normalizeNotation(input: string): string {
  const trimmed = foldCharacters(foldNumerals(input)).trim();
  if (trimmed === '') return 'd20';

  if (BARE_NUMBER.test(trimmed)) return `d${trimmed}`;

  const match = trimmed.match(SIMPLIFIED);
  if (match == null) return trimmed;

  const [, count, dice, modifier] = match;
  if (modifier == null) return `${count}d${dice}`;

  const signed = /^[+-]/.test(modifier) ? modifier : `+${modifier}`;
  return `${count}d${dice}${signed}`;
}

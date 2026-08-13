import { isNotationError, parse } from 'roll-parser';
import { normalizeNotation } from './notation';

/**
 * Closing quote to the openers it accepts. No quote character is a roll-parser
 * token, so a quoted tail can be stripped without consulting the parser.
 *
 * Mobile keyboards substitute typographic pairs by locale — `“…”` on iOS English,
 * `„…“` and `‚…‘` on German, `«…»` across the Cyrillic and Iberian layouts, `»…«`
 * on the Swiss and reversed-guillemet layouts. Some emit the same glyph on both
 * sides, hence the self-closing entries.
 */
const QUOTE_PAIRS: Record<string, string | undefined> = {
  '"': '"',
  "'": "'",
  '`': '`',
  '”': '“„”',
  '“': '„“',
  '’': '‘‚’',
  '‘': '‚‘’',
  '»': '«»',
  '«': '»«',
  '›': '‹›',
  '‹': '›‹',
};

// ! Counted in code points, and prepended after `formatDetailedResult` already capped the
//   body at 3500 — so this is the only thing keeping a reply under Telegram's 4096 limit.
//   Escaping expands a character fivefold at worst (`&` → `&amp;`), which puts the ceiling
//   at 500 characters of label plus 26 of markup.
const MAX_LABEL_LENGTH = 100;

const ELLIPSIS = '…';

/** Truncates to `max` code points, the last of them an ellipsis. Counted in code points so a
 * cap on escaped output holds: escaping expands per character, not per UTF-16 unit. */
export function capText(text: string, max: number): string {
  const points = [...text];
  if (points.length <= max) return text;
  return points.slice(0, max - 1).join('') + ELLIPSIS;
}

function capLabel(label: string): string {
  return capText(label, MAX_LABEL_LENGTH);
}

export interface LabelledInput {
  notation: string;
  label: string | null;
}

/** Every character some pair accepts as an opener. */
const OPENING_QUOTES = new Set([...Object.values(QUOTE_PAIRS).join('')]);

/**
 * Whether the notation half of a candidate split is something the parser accepts.
 *
 * `parse` rather than `roll`: no RNG and no `ROLL_LIMITS`, so a rejected candidate
 * costs a lex and a parse — cheap enough to run several times per inline keystroke.
 */
function isParseable(notation: string): boolean {
  try {
    parse(normalizeNotation(notation));
    return true;
  } catch (error) {
    if (isNotationError(error)) return false;
    throw error;
  }
}

function split(trimmed: string, open: number, end: number): LabelledInput {
  const label = trimmed.slice(open + 1, end).trim();
  return {
    notation: trimmed.slice(0, open).trim(),
    label: label === '' ? null : capLabel(label),
  };
}

/**
 * First quote that reads as an opener: at the start of the input, or after a space.
 * Requiring the space is what keeps a mid-word apostrophe from opening a label —
 * without a closer to prove intent, `2d6 s'more` would otherwise roll `2d6 s` sorted.
 */
function unterminatedOpener(trimmed: string): number {
  for (let i = 0; i < trimmed.length; i++) {
    if (!OPENING_QUOTES.has(trimmed.charAt(i))) continue;
    if (i === 0 || /\s/.test(trimmed.charAt(i - 1))) return i;
  }
  return -1;
}

/**
 * The splits worth trying, in the order a roll prefers them: a quote pair closed at
 * the end of the input, then an unterminated opener.
 *
 * ? Only the *first* opener of each kind earns a candidate. A later one leaves the
 * earlier quote inside the notation half, and no quote is a lexer token, so such a
 * split can never parse.
 */
function* candidates(trimmed: string): Generator<LabelledInput> {
  const openers = QUOTE_PAIRS[trimmed.at(-1) ?? ''];
  const closed = [...(openers ?? '')]
    .map((char) => trimmed.indexOf(char))
    .filter((index) => index !== -1);

  if (closed.length > 0) {
    const open = Math.min(...closed);
    // A closer that is its own opener can be the only quote in the input
    if (open < trimmed.length - 1) yield split(trimmed, open, -1);
  }

  const open = unterminatedOpener(trimmed);
  if (open !== -1) yield split(trimmed, open, trimmed.length);
}

/**
 * Splits a trailing quoted label off the input: `2d20+1 "Perception"` becomes
 * notation `2d20+1` and label `Perception`. A quote can never be part of valid
 * notation, so everything from the opener onward belongs to the label, and nested
 * quotes (`2d6 "he said "hi""`) survive intact.
 *
 * Which quote opens the label is a guess, so it is checked rather than trusted: the
 * first candidate split whose notation parses wins, and an input where none parse is
 * left whole for the parser to report on. A successful roll always beats a split.
 */
export function extractLabel(input: string): LabelledInput {
  const trimmed = input.trim();

  for (const candidate of candidates(trimmed)) {
    if (isParseable(candidate.notation)) return candidate;
  }

  return { notation: trimmed, label: null };
}

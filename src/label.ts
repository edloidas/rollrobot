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

function capLabel(label: string): string {
  const points = [...label];
  if (points.length <= MAX_LABEL_LENGTH) return label;
  return points.slice(0, MAX_LABEL_LENGTH - 1).join('') + ELLIPSIS;
}

export interface LabelledInput {
  notation: string;
  label: string | null;
}

/**
 * Splits a trailing quoted label off the input: `2d20+1 "Perception"` becomes
 * notation `2d20+1` and label `Perception`. The opener is the *first* accepted
 * quote in the string rather than the nearest one — a quote can never be part of
 * valid notation, so everything from it onward belongs to the label, and nested
 * quotes (`2d6 "he said "hi""`) survive intact.
 *
 * An unterminated quote is left in the notation for the parser to reject.
 */
export function extractLabel(input: string): LabelledInput {
  const trimmed = input.trim();

  const openers = QUOTE_PAIRS[trimmed.at(-1) ?? ''];
  if (openers == null) return { notation: trimmed, label: null };

  const found = [...openers].map((char) => trimmed.indexOf(char)).filter((index) => index !== -1);
  if (found.length === 0) return { notation: trimmed, label: null };

  const open = Math.min(...found);
  if (open === trimmed.length - 1) return { notation: trimmed, label: null };

  const label = trimmed.slice(open + 1, -1).trim();
  return {
    notation: trimmed.slice(0, open).trim(),
    label: label === '' ? null : capLabel(label),
  };
}

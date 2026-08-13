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

//
// * Unquoted labels (prototype #70)
//

/** How much proof a prefix needs before its tail is read as a label. */
export type PrefixMode =
  /** Off — quoted labels only, current shipped behaviour. */
  | 'off'
  /** Any parseable prefix wins, including the bare-number shorthand. */
  | 'greedy'
  /** The prefix must name a die outright — `2d6`, `d%`, `4dF`, `2к6`. */
  | 'die'
  /** `die`, plus the multi-word shorthand (`2 10 -1`) but not a lone bare number. */
  | 'die-or-shorthand'
  /** `die-or-shorthand`, and the prefix may not end on a bare modifier word. */
  | 'guarded'
  /** `guarded`, and a label made only of operators reads as an unfinished roll. */
  | 'strict';

/**
 * Names a die outright — `2d6`, `d%`, `4dF`, `2к6`. `к` is a die in the Cyrillic locales,
 * but only written against its numbers.
 *
 * ! The adjacency is what keeps the Russian odds idiom out. `2 к 1` — "two to one" — folds
 * to `2 d 1` and parses, so a standalone `к` would make `2 к 1 что он опоздает` roll a die
 * instead of reading as prose. It costs the spaced form `1 d 20 label`, which nobody types.
 */
const EXPLICIT_DIE = /[dкд]\S|\S[dкд]/i;

/** The whole space-separated shorthand, as `normalizeNotation` reads it — `2 10`, `2 10 -1`. */
const SHORTHAND = /^\d+\s+\d+(?:\s+[+-]?\d+)?$/;

/**
 * What a whitespace-separated word must carry before the notation may absorb it: a number,
 * or an operator joining it to one.
 *
 * ! Stated as what is allowed, not as a list of modifiers to exclude. The parser's bare
 * modifier vocabulary is far wider than it looks — `! !! !p !s k! cf cs sa sd` all attach —
 * and `normalizeNotation` folds `к`/`д` to `d` afterwards, so `4d6 кh` reaches it as
 * `4d6 dh`. Any denylist would have to track both, and would silently reopen every time
 * either grows. A count is the thing that proves a modifier was meant: `2d6 kh1 attack`
 * keeps its `kh1`, `d20 kh check the door` does not keep its `kh`.
 */
const COUNTED = /[\d٠-٩۰-۹]/;

/** Operators, which carry no count of their own — the `+` in `1d20 + 3 for luck`. */
const OPERATOR = /^[-+*/x×÷–—−]+$/i;

/**
 * Whether every word the notation absorbed past the first carries a count.
 *
 * A modifier may hold its count at arm's length — `2d6 vs 15`, `4d6 kh 3`, `4d6 dl 1` are all
 * notation the parser accepts — so a word with no digit of its own passes on the strength of
 * the next one. `d20 kh check the door` still fails: `check` has no digit either.
 */
function isCounted(notation: string): boolean {
  const words = notation.split(/\s+/);
  return words.every(
    (word, index) =>
      index === 0 ||
      COUNTED.test(word) ||
      OPERATOR.test(word) ||
      COUNTED.test(words[index + 1] ?? ''),
  );
}

/**
 * A label carrying no prose at all — `1d20 +`, `2d6 x`. Nobody names a roll `+`, so this is
 * a half-typed modifier, and the input is worth more as an error message than as a label.
 */
const OPERATOR_ONLY = /^[-+*/x×÷–—−\s\d]+$/i;

function isProof(notation: string, mode: PrefixMode): boolean {
  if (mode === 'greedy') return true;
  if (mode !== 'die' && mode !== 'die-or-shorthand' && !isCounted(notation)) return false;
  if (EXPLICIT_DIE.test(notation)) return true;
  return mode !== 'die' && SHORTHAND.test(notation);
}

/**
 * ! The scan costs a parse per word, and prose never parses, so an unbounded one would spend
 * a parse on every word of every message that is not a roll — ~100ms of Worker CPU on a
 * 4096-character message against ~0.01ms today, growing quadratically. Notation is a run at
 * the front of the input, so a few failures in a row mean the notation ended and prose began.
 *
 * ! Three is measured, not chosen: over every spaced notation in roll-parser's own test corpus
 * the longest run of non-parsing prefixes *inside* a valid notation is one — `1d20 + 7 vs 15`
 * breaks only at `1d20 + 7 vs`. That holds only once bracket-cut prefixes are excluded below;
 * counting those, `{1d20 vs 15, 1d6 vs 10, 1d4}kh2` runs to six and any nesting runs further.
 */
const MAX_MISSES = 3;

/** Backstop for input crafted to keep parsing forever — `1d20 + 1 + 1 + 1 …`. */
const MAX_NOTATION_WORDS = 32;

/**
 * Whether a prefix cuts through a group. `(1d20 vs 15) + (1d20` and `{1d6,` can never parse
 * whatever follows them, so they are not evidence that the notation has ended — counting them
 * as failures is what made a miss run unbounded.
 */
function isBalanced(prefix: string): boolean {
  let round = 0;
  let curly = 0;
  for (const char of prefix) {
    if (char === '(') round++;
    else if (char === ')') round--;
    else if (char === '{') curly++;
    else if (char === '}') curly--;
    if (round < 0 || curly < 0) return false;
  }
  return round === 0 && curly === 0;
}

/**
 * The longest whitespace-bounded prefix that parses, or `null` when there is none.
 *
 * ! Scanned forward while keeping the last success, rather than backward and stopping at the
 * first: parseability is not monotonic along the prefixes — `1d20 +` fails where `1d20 + 3`
 * succeeds — so a run of failures is not the end of the notation, only three of them is.
 *
 * ! Hitting the ceiling still mid-notation returns nothing rather than the prefix in hand. A
 * truncated prefix parses perfectly well, so rolling it would drop `+ 1` off the end of
 * `2d6 + 1d8 + 1d4 + 2 + 1 урон` and say nothing — the one failure the reply cannot show.
 */
function prefixSplit(trimmed: string, mode: PrefixMode): LabelledInput | null {
  const breaks: number[] = [];
  for (const match of trimmed.matchAll(/\s+/g)) {
    breaks.push(match.index);
    if (breaks.length > MAX_NOTATION_WORDS) break;
  }

  let best: LabelledInput | null = null;
  let misses = 0;
  let index = 0;

  for (; index < breaks.length && misses < MAX_MISSES; index++) {
    const end = breaks[index] as number;
    const label = trimmed.slice(end).trim();
    const notation = trimmed.slice(0, end);
    if (label === '' || !isBalanced(notation)) continue;

    if (!isProof(notation, mode) || !isParseable(notation)) {
      misses++;
      continue;
    }
    misses = 0;
    best = { notation, label: capLabel(label) };
  }

  // ! The scan ended on the ceiling rather than on a run of misses, so there are words left
  //   it never looked at and no evidence the notation ended. `misses === 0` was the wrong
  //   test: on an even-word notation the ceiling lands on a miss, and a truncated `best` —
  //   which parses perfectly well — would go out as the roll.
  const cappedMidNotation = index > MAX_NOTATION_WORDS;
  return cappedMidNotation ? null : best;
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
export function extractLabel(input: string, mode: PrefixMode = 'off'): LabelledInput {
  const trimmed = input.trim();

  for (const candidate of candidates(trimmed)) {
    if (isParseable(candidate.notation)) return candidate;
  }

  // A quoteless split is only reached once the whole input has failed to parse on its own —
  // a successful roll always beats a label
  if (mode !== 'off' && !isParseable(trimmed)) {
    const candidate = prefixSplit(trimmed, mode);
    // ! An operator-only label is an unfinished roll, and the answer is the error, not a
    //   shorter prefix: `4d6 kh3 6` dropping to `4d6` would roll dice nobody asked for
    if (
      candidate != null &&
      !(mode === 'strict' && OPERATOR_ONLY.test(candidate.label as string))
    ) {
      return candidate;
    }
  }

  return { notation: trimmed, label: null };
}

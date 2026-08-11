import {
  DegreeOfSuccess,
  type DieResult,
  getErrorSpan,
  type RollPart,
  type RollParserError,
  type RollResult,
} from 'roll-parser';

// ! Telegram rejects messages over 4096 chars — detailed replies fall back
//   to the compact form beyond this threshold
const MAX_DETAILED_LENGTH = 3500;

const CRITICAL_MARK = '↑';
const FUMBLE_MARK = '↓';

// ? Every max face sets `critical`; below d6 the extremes come up too often for a
//   mark to carry information.
const MIN_MARKED_SIDES = 6;

const DEGREE_LABELS: Record<DegreeOfSuccess, string> = {
  [DegreeOfSuccess.CriticalSuccess]: 'Critical Success',
  [DegreeOfSuccess.Success]: 'Success',
  [DegreeOfSuccess.Failure]: 'Failure',
  [DegreeOfSuccess.CriticalFailure]: 'Critical Failure',
};

// ! Direction controls survive HTML escaping and reorder everything after them, so a reply
//   could show text its sender never wrote. Excludes ZWNJ and ZWJ, which Persian needs.
const BIDI_CONTROL = /\p{Bidi_Control}/gu;

function nameControl(char: string): string {
  return `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(BIDI_CONTROL, nameControl);
}

/**
 * Converts the parser's markdown breakdown markers to Telegram HTML:
 * `~~n~~` (dropped) to strikethrough, `**n**` (success) to bold,
 * `__n__` (failure) to underline. Escapes first, so notation characters
 * never inject markup.
 */
function renderBreakdown(rendered: string): string {
  return escapeHtml(rendered)
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>');
}

/**
 * Drops the dice notation in front of each rolled group — `2d10[7, 1] - 1`
 * becomes `[7, 1] - 1`. The notation is already on the compact line above,
 * so repeating it only adds noise.
 */
function stripDiceNotation(rendered: string): string {
  return rendered.replace(/\d*d[^\s[]*(?=\[)/g, '');
}

type Marking = { critical: boolean; fumble: boolean; penetrating: boolean };

const NO_MARKING: Marking = { critical: false, fumble: false, penetrating: false };

/**
 * What the notation says about marking a pool: which of `cs` / `cf` it spells out, and
 * whether a penetrating explosion is in play. Declaring a threshold states interest in
 * that extreme, so it lifts the die-size floor for that mark alone — `6d4cf` marks the
 * 1s and leaves the 4s be.
 */
function readMarking(part: RollPart | undefined, found: Marking = { ...NO_MARKING }): Marking {
  if (part == null) return found;

  switch (part.type) {
    case 'critThreshold':
      found.critical ||= part.successThresholds.length > 0;
      found.fumble ||= part.failThresholds.length > 0;
      return readMarking(part.target, found);
    case 'explode':
      found.penetrating ||= part.variant === 'penetrating';
      return readMarking(part.target, found);
    case 'grouped':
      return readMarking(part.inner, found);
    case 'binaryOp':
      return readMarking(part.right, readMarking(part.left, found));
    case 'unaryOp':
      return readMarking(part.operand, found);
    case 'keepDrop':
    case 'reroll':
    case 'dieBound':
    case 'successCount':
    case 'sort':
      return readMarking(part.target, found);
    case 'versus':
      return readMarking(part.dc, readMarking(part.roll, found));
    case 'functionCall':
      return part.args.reduce((acc, arg) => readMarking(arg, acc), found);
    case 'group':
      return part.parts.reduce((acc, child) => readMarking(child, acc), found);
    default:
      return found;
  }
}

/**
 * One die and its markers. The glyph goes inside the emphasis marker, so a die that is
 * both a critical and a success renders `**20↑**` and Telegram carries the emphasis
 * over the glyph.
 *
 * A die whose `result` was rewritten goes unmarked: `minN`/`maxN` and compound
 * explosions stash the raw face in `initialResult`, a penetrating explosion decrements
 * without recording anything, and the default rule flags the face rather than the number
 * on screen — so `2d6max2` would otherwise show a critical `2`. An explicit `cs`/`cf`
 * written outside the rewriting modifier (`2d6min5cs=5`) is scored on the shown value
 * and loses its mark here; separating the two needs modifier order from the parts tree.
 */
function renderPoolDie(die: DieResult, marking: Marking): string {
  const large = die.sides >= MIN_MARKED_SIDES;
  const decremented = marking.penetrating && die.modifiers.includes('exploded');
  const shown = die.initialResult == null && !decremented;

  let rendered = String(die.result);
  if (shown && die.critical && (large || marking.critical)) rendered += CRITICAL_MARK;
  else if (shown && die.fumble && (large || marking.fumble)) rendered += FUMBLE_MARK;

  if (die.modifiers.includes('dropped')) return `~~${rendered}~~`;
  if (die.modifiers.includes('success')) return `**${rendered}**`;
  if (die.modifiers.includes('failure')) return `__${rendered}__`;
  return rendered;
}

/**
 * Rewrites the dice bracket from `result.rolls`, the only place crit and fumble
 * flags exist — the parser never writes them into `rendered`.
 *
 * Only a single-bracket breakdown is rewritten: part spans index the notation rather
 * than the rendered string, so with several pools there is no telling which bracket a
 * die belongs to. That also keeps out the DC side of a `vs` and pools fed by meta dice.
 *
 * A group keep/drop strikes a whole sub-roll — `{~~2d6[6, 3]~~, 5}` clears the
 * one-bracket bar — where per-die `~~` would nest and `renderBreakdown` could not pair it.
 */
function markCritDice(result: RollResult, breakdown: string): string {
  const first = breakdown.indexOf('[');
  if (first === -1 || first !== breakdown.lastIndexOf('[')) return breakdown;
  if (breakdown.slice(0, first).includes('~~')) return breakdown;

  const pool = result.rolls.filter(
    (die) => !die.modifiers.includes('meta') && !die.modifiers.includes('dc'),
  );
  if (pool.length === 0) return breakdown;

  const marking = readMarking(result.parts);
  const dice = pool.map((die) => renderPoolDie(die, marking)).join(', ');
  return breakdown.replace(/\[[^\]]*\]/, `[${dice}]`);
}

function pluralize(count: number, word: string): string {
  const suffix = word.endsWith('s') ? 'es' : 's';
  return `<b>${count}</b> ${word}${count === 1 ? '' : suffix}`;
}

/** The outcome half of a reply: degree for `vs`, counts for pools, plain total otherwise. */
function formatOutcome(result: RollResult): string {
  if (result.degree != null) {
    const natural = result.natural != null ? ` (natural ${result.natural})` : '';
    return `<b>${DEGREE_LABELS[result.degree]}</b>${natural}`;
  }

  if (result.successes != null) {
    const failures =
      result.failures != null && result.failures > 0
        ? `, ${pluralize(result.failures, 'failure')}`
        : '';
    return `${pluralize(result.successes, 'success')}${failures}`;
  }

  return `<b>${result.total}</b>`;
}

/** Compact reply: normalized expression and the outcome on one line. */
export function formatResult(result: RollResult): string {
  return `<code>${escapeHtml(result.expression)}</code> = ${formatOutcome(result)}`;
}

/** Puts the roll's name above it as a quote. Passing no label leaves the reply untouched. */
export function withLabel(reply: string, label?: string | null): string {
  return label ? `<blockquote>${escapeHtml(label)}</blockquote>\n${reply}` : reply;
}

/**
 * Detailed reply: the compact line plus the per-die breakdown. The parser's
 * `rendered` string ends with an `= total` tail that duplicates the first
 * line, so it is stripped. Oversized breakdowns fall back to the compact form.
 */
export function formatDetailedResult(result: RollResult): string {
  const compact = formatResult(result);

  const tailIndex = result.rendered.lastIndexOf(' = ');
  const breakdown = tailIndex > 0 ? result.rendered.slice(0, tailIndex) : result.rendered;
  const marked = markCritDice(result, breakdown);
  const detailed = `${compact}\n${renderBreakdown(stripDiceNotation(marked))}`;

  return detailed.length > MAX_DETAILED_LENGTH ? compact : detailed;
}

type CaretSpan = { start: number; end: number };

// ! Carets are placed by code-unit offset, so they only land right when every character is
//   one code unit and one column, rendered where it is stored. Right-to-left runs,
//   combining marks, and wide or astral characters break that; these scripts do not.
const CARETABLE = /^[\x20-\x7e\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]*$/u;

/** Clamps the parser's span to the echoed notation, so the carets always land on it. */
function resolveCaretSpan(error: RollParserError, length: number): CaretSpan | null {
  const span = getErrorSpan(error);
  if (span == null || span.start >= length) return null;

  const start = Math.max(span.start, 0);
  const end = span.end != null ? Math.min(span.end, length) : start + 1;
  return { start, end: Math.max(end, start + 1) };
}

/**
 * Error reply: the parser message plus the notation echoed in a `pre` block
 * with the offending span underlined by carets. Notation the carets cannot be
 * aligned against still gets its echo, just without the caret line. Multiline
 * notation skips the echo outright — there is no single line to point at.
 */
export function formatError(error: RollParserError, notation: string): string {
  const message = `<i>${escapeHtml(error.message)}.</i>`;
  if (notation === '' || notation.includes('\n')) return message;

  const span = CARETABLE.test(notation) ? resolveCaretSpan(error, notation.length) : null;
  if (span == null) return `${message}\n<pre>${escapeHtml(notation)}</pre>`;

  const carets = `${' '.repeat(span.start)}${'^'.repeat(span.end - span.start)}`;
  return `${message}\n<pre>${escapeHtml(notation)}\n${carets}</pre>`;
}

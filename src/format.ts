import { DegreeOfSuccess, type RollParserError, type RollResult } from 'roll-parser';

// ! Telegram rejects messages over 4096 chars — detailed replies fall back
//   to the compact form beyond this threshold
const MAX_DETAILED_LENGTH = 3500;

const DEGREE_LABELS: Record<DegreeOfSuccess, string> = {
  [DegreeOfSuccess.CriticalSuccess]: 'Critical Success',
  [DegreeOfSuccess.Success]: 'Success',
  [DegreeOfSuccess.Failure]: 'Failure',
  [DegreeOfSuccess.CriticalFailure]: 'Critical Failure',
};

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

/**
 * Detailed reply: the compact line plus the per-die breakdown. The parser's
 * `rendered` string ends with an `= total` tail that duplicates the first
 * line, so it is stripped. Oversized breakdowns fall back to the compact form.
 */
export function formatDetailedResult(result: RollResult): string {
  const compact = formatResult(result);

  const tailIndex = result.rendered.lastIndexOf(' = ');
  const breakdown = tailIndex > 0 ? result.rendered.slice(0, tailIndex) : result.rendered;
  const detailed = `${compact}\n${renderBreakdown(breakdown)}`;

  return detailed.length > MAX_DETAILED_LENGTH ? compact : detailed;
}

type ErrorSpan = { start: number; end: number };

/** Normalizes lexer/parser `position` and evaluator `start`/`end` into one span. */
function resolveErrorSpan(error: RollParserError, length: number): ErrorSpan | null {
  const { position, start, end } = error as { position?: number; start?: number; end?: number };
  const from = position ?? start;
  if (from == null || from >= length) return null;

  const to = end != null ? Math.min(end, length) : from + 1;
  return { start: Math.max(from, 0), end: Math.max(to, from + 1) };
}

/**
 * Error reply: the parser message plus the notation echoed in a `pre` block
 * with the offending span underlined by carets. Multiline notation skips the
 * echo — caret alignment only works on a single line.
 */
export function formatError(error: RollParserError, notation: string): string {
  const message = `<i>${escapeHtml(error.message)}.</i>`;
  if (notation === '' || notation.includes('\n')) return message;

  const span = resolveErrorSpan(error, notation.length);
  if (span == null) return `${message}\n<pre>${escapeHtml(notation)}</pre>`;

  const carets = `${' '.repeat(span.start)}${'^'.repeat(span.end - span.start)}`;
  return `${message}\n<pre>${escapeHtml(notation)}\n${carets}</pre>`;
}

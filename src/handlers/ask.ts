import { roll } from 'roll-parser';
import { withLabel } from '../format';
import { capText } from '../label';

/** The coin behind an answer, so randomness has one source across the bot. */
const ASK_NOTATION = 'd2';

const YES = '<b>Yes</b> ✅';
const NO = '<b>No</b> ❌';

// ! The question is echoed back inside the reply and nothing else on this path caps it —
//   `extractLabel` never runs, so its own cap is out of reach. Escaping expands a character
//   sixfold at worst (a bidi control becomes `U+200F`), which leaves 300 code points an order
//   of magnitude clear of Telegram's 4096 limit.
const MAX_QUESTION_LENGTH = 300;

export interface Answer {
  text: string;
  /** The question as it appears in the reply — trimmed and capped — or `null` when none was asked. */
  question: string | null;
}

/**
 * Answers Yes or No, quoting the question above it.
 *
 * The answer stays English in every locale. Telegram reports the sender's interface
 * language, which is a poor guess at the language of the chat they are writing in — a
 * Russian-configured client asking a question in an English group would get `Да`.
 *
 * grammY only trims the leading side of a command's argument, so the trailing side is
 * trimmed here — otherwise `/ask Rain?⏎⏎` leaves blank lines inside the quote.
 */
export function askReply(question?: string | null): Answer {
  const asked = question?.trim();
  const capped = asked ? capText(asked, MAX_QUESTION_LENGTH) : null;
  const answer = roll(ASK_NOTATION).total === 1 ? YES : NO;
  return { text: withLabel(answer, capped), question: capped };
}

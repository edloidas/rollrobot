import { roll } from 'roll-parser';
import { escapeHtml, withLabel } from '../format';
import { DEFAULT_LOCALE, type Locale, messages } from '../i18n';
import { capText } from '../label';
import { MAX_PICK_ITEMS } from '../limits';
import { splitOptions } from '../options';

/** The die behind a pick, so randomness has one source across the bot. */
function chooseIndex(count: number): number {
  return roll(`d${count}`).total - 1;
}

// ! Both are echoed back inside the reply, and escaping expands a character sixfold at
//   worst (a bidi control becomes `U+200F`). Two capped runs plus a 100-point label leave
//   the reply around 3100 characters, comfortably inside Telegram's 4096 limit.
const MAX_CHOICE_LENGTH = 200;
const MAX_POOL_LENGTH = 200;

const POOL_SEPARATOR = ' · ';

export interface PickOptions {
  /** Echo the pool under the winner. Inline messages have no command above them to reply to. */
  echo?: boolean;
}

export interface Pick {
  text: string;
  /** The option chosen, or `null` when there was nothing to pick from. */
  choice: string | null;
}

/** Escapes only after capping — cutting escaped text can split an entity, which Telegram rejects. */
function bounded(text: string, max: number): string {
  return escapeHtml(capText(text, max));
}

/**
 * Picks one option at random and bolds it, quoting the label above it when one was given.
 *
 * The pool is not echoed by default: a group reply threads to the command message, so
 * Telegram already shows the list right above the answer.
 */
export function pickReply(
  input?: string | null,
  locale: Locale = DEFAULT_LOCALE,
  { echo = false }: PickOptions = {},
): Pick {
  const { options, label, tier } = splitOptions(input ?? '');
  const text = messages(locale).pick;

  if (options.length > MAX_PICK_ITEMS) return { text: text.tooMany, choice: null };
  if (options.length < 2) return { text: text.usage, choice: null };

  const choice = options[chooseIndex(options.length)];
  const lines = [`<b>${bounded(choice, MAX_CHOICE_LENGTH)}</b>`];

  if (echo) lines.push(`<i>${bounded(options.join(POOL_SEPARATOR), MAX_POOL_LENGTH)}</i>`);
  // Only the loose split earns a note; naming a separator explicitly is already unambiguous
  if (tier === 'space') lines.push(`<i>${text.spaceSplit}</i>`);

  return { text: withLabel(lines.join('\n'), label), choice };
}

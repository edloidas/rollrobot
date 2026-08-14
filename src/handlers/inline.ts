import type { InlineQueryResult } from 'grammy/types';
import { isNotationError, roll, type RollResult } from 'roll-parser';
import { formatDetailedResult, formatResult, withLabel } from '../format';
import { DEFAULT_LOCALE, type Locale, type Messages, messages, betaTitle } from '../i18n';
import { capText, extractLabel, isParseable } from '../label';
import { ROLL_LIMITS } from '../limits';
import { normalizeNotation } from '../notation';
import { splitOptions } from '../options';
import { askReply } from './ask';
import { pickReply } from './pick';
import { RANDOM_NOTATION } from './random';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'HTML' as const,
    link_preview_options: { is_disabled: true },
  };
}

type InlineVariant = 'roll' | 'full' | 'random' | 'ask' | 'pick';

function createArticle(
  variant: InlineVariant,
  title: string,
  description: string,
  message: string,
): InlineQueryResult {
  return {
    type: 'article',
    // Prefix exposes the chosen variant in `chosen_inline_result.result_id`
    id: `${variant}:${crypto.randomUUID()}`,
    title,
    input_message_content: createInputMessageContent(message),
    description,
  };
}

/** The article subtitle only previews the pool; Telegram truncates the rest anyway. */
const MAX_POOL_DESCRIPTION = 120;

export const DEFAULT_NOTATION = 'd20';

function tryRoll(notation: string): RollResult | null {
  try {
    return roll(notation, ROLL_LIMITS);
  } catch (error) {
    if (isNotationError(error)) return null;
    throw error;
  }
}

/** Compact and detailed articles sharing one result — the choice is about display, not a reroll. */
function createVariantArticles(
  result: RollResult,
  description: string,
  titles: Messages['inline'],
  label?: string | null,
): InlineQueryResult[] {
  return [
    createArticle('roll', titles.roll, description, withLabel(formatResult(result), label)),
    createArticle('full', titles.full, description, withLabel(formatDetailedResult(result), label)),
  ];
}

function createQueryArticles(
  result: RollResult,
  titles: Messages['inline'],
  label: string | null,
): InlineQueryResult[] {
  return createVariantArticles(result, result.expression, titles, label);
}

/** Fallback list: the three commands, on their default notation. */
function createPresetArticles(titles: Messages['inline']): InlineQueryResult[] {
  return [
    ...createVariantArticles(roll(DEFAULT_NOTATION), DEFAULT_NOTATION, titles),
    createArticle('random', titles.random, RANDOM_NOTATION, formatResult(roll(RANDOM_NOTATION))),
  ];
}

export interface InlineQueryResponse {
  results: InlineQueryResult[];
  hasInvalidQuery: boolean;
}

interface QueryRoll {
  result: RollResult;
  label: string | null;
}

/** The roll a query stands for, or `null` when the presets are shown instead. */
function resolveQueryRoll(query: string): QueryRoll | null {
  const { notation, label } = extractLabel(query);
  const hasQuery = notation !== '' && notation !== 'd';

  // A label with no notation rolls the default, the same as a bare `/roll "attack"`
  if (!hasQuery && label == null) return null;

  const result = tryRoll(normalizeNotation(notation));
  return result == null ? null : { result, label };
}

/**
 * The roll behind a chosen inline result — its shape only, never its total: the
 * update carries just the query, so this re-rolls and falls back to the preset
 * the user saw when the query does not parse.
 *
 * ! Notation within a few dice of `maxDice` can cross the limit on one
 *   evaluation and not the other, so its shape may disagree with what was sent.
 */
export function chosenInlineRoll(query: string, variant: string): RollResult {
  if (variant === 'random') return roll(RANDOM_NOTATION);
  return resolveQueryRoll(query)?.result ?? roll(DEFAULT_NOTATION);
}

/** Names a die outright — `2d6`, `d%`, `4dF` — as opposed to the bare-number shorthand. */
const EXPLICIT_DIE = /d/i;

/**
 * Whether the query reads as a question rather than a roll, and so earns an `Ask` article.
 *
 * The die-marker test is deliberately gated behind a successful parse: `Should I text her?`
 * carries a `d` in "Should" and has to stay a question. Shorthand notation is left as a
 * question too — `2024` and `1 2` roll `d2024` and `1d2`, but neither is a die anyone named.
 *
 * ! A quoted question is why the parse alone cannot decide this. `"Should I text her?"`, and
 *   the `“…”` / `«…»` pairs mobile keyboards substitute, parse today as a `d20` labelled with
 *   the question — so hiding `Ask` whenever a roll parsed would hide it exactly where a
 *   question is likeliest.
 */
function isQuestion(query: string, resolved: QueryRoll | null, notation: string): boolean {
  const asked = query.trim();
  // Nothing, or a lone `d`, is notation being typed rather than a question — the two cases
  // `resolveQueryRoll` also declines to roll on
  if (asked === '' || asked === 'd') return false;
  return resolved == null || !EXPLICIT_DIE.test(notation);
}

/**
 * Whether the query reads as a list to pick from rather than as notation.
 *
 * ! Both halves are required, and the conjunction is the whole point. A separator alone is
 *   not enough: a comma is valid inside a Savage Worlds pool (`{1d8!, 1d6!}kh1`) and in
 *   function arguments (`max(1d6, 1d8)`), a newline is plain whitespace to the grammar, and
 *   `@{a|b}` makes every separator legal — so keying on the separator would shred real
 *   notation into a pick. A parse failure alone is not enough either: the space fallback
 *   splits `Should I text her?` into four options, so every question typed inline would
 *   offer a nonsense pick alongside its answer.
 */
function isPickQuery(notation: string): boolean {
  if (isTyping(notation)) return false;
  const { tier } = splitOptions(notation);
  return tier != null && tier !== 'space' && !isParseable(notation);
}

/**
 * Notation still being typed: a bracket opened and not yet closed. Inline queries arrive per
 * keystroke, so every prefix of `{1d8!, 1d6!}kh1` and `max(1d6, 1d8)` passes the pick gate on
 * its way to becoming valid — and would put a nonsense `{1d8! · 1d6` pick above the roll the
 * user is halfway through writing. Lists carry balanced brackets or none.
 */
function isTyping(notation: string): boolean {
  const count = (char: string) => [...notation].filter((each) => each === char).length;
  return count('(') !== count(')') || count('{') !== count('}');
}

/** Built from the whole query, so a trailing label survives; `null` past `MAX_PICK_ITEMS`. */
function createPickArticle(
  query: string,
  titles: Messages['inline'],
  locale: Locale,
): InlineQueryResult | null {
  const { text, choice } = pickReply(query, locale, { echo: true });
  if (choice == null) return null;
  const pool = capText(splitOptions(query).options.join(' · '), MAX_POOL_DESCRIPTION);
  return createArticle('pick', betaTitle(titles.pick, 'pick'), pool, text);
}

/** Trailing when the query rolled on notation of its own; there the question is the aside. */
function isAskTrailing(resolved: QueryRoll | null, notation: string): boolean {
  return resolved != null && notation !== '' && notation !== 'd';
}

export function createInlineArticles(
  query = '',
  locale: Locale = DEFAULT_LOCALE,
): InlineQueryResponse {
  const titles = messages(locale).inline;
  const { notation } = extractLabel(query);
  const resolved = resolveQueryRoll(query);

  const rolls =
    resolved != null
      ? createQueryArticles(resolved.result, titles, resolved.label)
      : createPresetArticles(titles);

  const pick = isPickQuery(notation) ? createPickArticle(query, titles, locale) : null;

  // A list under a named separator is not a yes/no question, and the help button explains
  // notation — neither belongs on a query whose intent is already unambiguous
  const ask =
    pick == null && isQuestion(query, resolved, notation)
      ? createArticle('ask', titles.ask, titles.answer, askReply(query).text)
      : null;

  return {
    results: orderArticles(rolls, pick, ask, resolved, notation),
    // ! Left on the parse alone, pick or no pick. Suppressing it under a pick would hide the
    //   button on exactly the half-typed notation that most needs it, since a list and a
    //   broken roll are indistinguishable until the roll is finished.
    hasInvalidQuery: resolved == null && notation !== '' && notation !== 'd',
  };
}

function orderArticles(
  rolls: InlineQueryResult[],
  pick: InlineQueryResult | null,
  ask: InlineQueryResult | null,
  resolved: QueryRoll | null,
  notation: string,
): InlineQueryResult[] {
  if (pick != null) return [pick, ...rolls];
  return ask == null ? rolls : askArticles(rolls, ask, resolved, notation);
}

function askArticles(
  rolls: InlineQueryResult[],
  ask: InlineQueryResult,
  resolved: QueryRoll | null,
  notation: string,
): InlineQueryResult[] {
  return isAskTrailing(resolved, notation) ? [...rolls, ask] : [ask, ...rolls];
}

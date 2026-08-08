import type { InlineQueryResult } from 'grammy/types';
import { isNotationError, roll, type RollResult } from 'roll-parser';
import { formatDetailedResult, formatResult, formatTotal, withLabel } from '../format';
import { DEFAULT_LOCALE, type Locale, type Messages, messages } from '../i18n';
import { extractLabel } from '../label';
import { ROLL_LIMITS } from '../limits';
import { normalizeNotation } from '../notation';
import { RANDOM_NOTATION } from './random';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'HTML' as const,
    link_preview_options: { is_disabled: true },
  };
}

type InlineVariant = 'roll' | 'full' | 'random';

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

const DEFAULT_NOTATION = 'd20';

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
    createArticle('random', titles.random, RANDOM_NOTATION, formatTotal(roll(RANDOM_NOTATION))),
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

export function createInlineArticles(
  query = '',
  locale: Locale = DEFAULT_LOCALE,
): InlineQueryResponse {
  const titles = messages(locale).inline;
  const resolved = resolveQueryRoll(query);

  if (resolved != null) {
    return {
      results: createQueryArticles(resolved.result, titles, resolved.label),
      hasInvalidQuery: false,
    };
  }

  const { notation } = extractLabel(query);
  return {
    results: createPresetArticles(titles),
    hasInvalidQuery: notation !== '' && notation !== 'd',
  };
}

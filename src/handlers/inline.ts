import type { InlineQueryResult } from 'grammy/types';
import { isNotationError, roll, type RollResult } from 'roll-parser';
import { formatDetailedResult, formatResult, formatTotal } from '../format';
import { DEFAULT_LOCALE, type Locale, type Messages, messages } from '../i18n';
import { ROLL_LIMITS } from '../limits';
import { normalizeNotation } from '../notation';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'HTML' as const,
    link_preview_options: { is_disabled: true },
  };
}

function createArticle(title: string, description: string, message: string): InlineQueryResult {
  return {
    type: 'article',
    id: crypto.randomUUID(),
    title,
    input_message_content: createInputMessageContent(message),
    description,
  };
}

const DEFAULT_NOTATION = 'd20';
const RANDOM_NOTATION = 'd100';

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
): InlineQueryResult[] {
  return [
    createArticle(titles.roll, description, formatResult(result)),
    createArticle(titles.full, description, formatDetailedResult(result)),
  ];
}

function createQueryArticles(result: RollResult, titles: Messages['inline']): InlineQueryResult[] {
  return createVariantArticles(result, result.expression, titles);
}

/** Fallback list: the three commands, on their default notation. */
function createPresetArticles(titles: Messages['inline']): InlineQueryResult[] {
  return [
    ...createVariantArticles(roll(DEFAULT_NOTATION), DEFAULT_NOTATION, titles),
    createArticle(titles.random, RANDOM_NOTATION, formatTotal(roll(RANDOM_NOTATION))),
  ];
}

export interface InlineQueryResponse {
  results: InlineQueryResult[];
  hasInvalidQuery: boolean;
}

export function createInlineArticles(
  query = '',
  locale: Locale = DEFAULT_LOCALE,
): InlineQueryResponse {
  const trimmed = query.trim();
  const hasQuery = trimmed !== '' && trimmed !== 'd';
  const titles = messages(locale).inline;

  if (hasQuery) {
    const result = tryRoll(normalizeNotation(trimmed));
    if (result != null) {
      return { results: createQueryArticles(result, titles), hasInvalidQuery: false };
    }
  }

  return { results: createPresetArticles(titles), hasInvalidQuery: hasQuery };
}

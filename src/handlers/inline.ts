import type { InlineQueryResult } from 'grammy/types';
import { isNotationError, roll, type RollResult } from 'roll-parser';
import { formatDetailedResult, formatResult, formatTotal } from '../format';
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

// ? Titles mirror the commands, so the inline list doubles as command discovery
const ROLL_TITLE = 'Roll';
const FULL_TITLE = 'Full';
const RANDOM_TITLE = 'Random';

function tryRoll(notation: string): RollResult | null {
  try {
    return roll(notation, ROLL_LIMITS);
  } catch (error) {
    if (isNotationError(error)) return null;
    throw error;
  }
}

/** Compact and detailed articles sharing one result — the choice is about display, not a reroll. */
function createVariantArticles(result: RollResult, description: string): InlineQueryResult[] {
  return [
    createArticle(ROLL_TITLE, description, formatResult(result)),
    createArticle(FULL_TITLE, description, formatDetailedResult(result)),
  ];
}

function createQueryArticles(result: RollResult): InlineQueryResult[] {
  return createVariantArticles(result, result.expression);
}

/** Fallback list: the three commands, on their default notation. */
function createPresetArticles(): InlineQueryResult[] {
  return [
    ...createVariantArticles(roll(DEFAULT_NOTATION), DEFAULT_NOTATION),
    createArticle(RANDOM_TITLE, RANDOM_NOTATION, formatTotal(roll(RANDOM_NOTATION))),
  ];
}

export interface InlineQueryResponse {
  results: InlineQueryResult[];
  hasInvalidQuery: boolean;
}

export function createInlineArticles(query = ''): InlineQueryResponse {
  const trimmed = query.trim();
  const hasQuery = trimmed !== '' && trimmed !== 'd';

  if (hasQuery) {
    const result = tryRoll(normalizeNotation(trimmed));
    if (result != null) {
      return { results: createQueryArticles(result), hasInvalidQuery: false };
    }
  }

  return { results: createPresetArticles(), hasInvalidQuery: hasQuery };
}

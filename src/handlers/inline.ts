import type { InlineQueryResult } from 'grammy/types';
import { isRollParserError, roll, type RollResult } from 'roll-parser';
import { ROLL_LIMITS } from '../limits';
import { createFullResultMessage } from '../text';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'Markdown' as const,
    link_preview_options: { is_disabled: true },
  };
}

function createArticle(
  title: string,
  description: string,
  message: string,
  thumbnailUrl: string,
): InlineQueryResult {
  return {
    type: 'article',
    id: crypto.randomUUID(),
    title,
    input_message_content: createInputMessageContent(message),
    description,
    thumbnail_url: thumbnailUrl,
    thumbnail_width: 64,
    thumbnail_height: 64,
  };
}

const ASSET_BASE = 'https://raw.githubusercontent.com/edloidas/rollrobot/master/assets';

function tryRoll(notation: string): RollResult | null {
  try {
    return roll(notation, ROLL_LIMITS);
  } catch (error) {
    if (isRollParserError(error)) return null;
    throw error;
  }
}

function createRollArticle(notation: string): InlineQueryResult | null {
  const result = tryRoll(notation || 'd20');
  return result
    ? createArticle(
        'Roll',
        result.expression,
        createFullResultMessage(result),
        `${ASSET_BASE}/dnd-icon.png`,
      )
    : null;
}

function createRandomArticle(): InlineQueryResult {
  const result = roll('d100');
  return createArticle(
    'Random',
    result.expression,
    createFullResultMessage(result),
    `${ASSET_BASE}/d20-icon.png`,
  );
}

export interface InlineQueryResponse {
  results: InlineQueryResult[];
  hasInvalidQuery: boolean;
}

export function createInlineArticles(query = ''): InlineQueryResponse {
  const notation = query.trim() === 'd' ? '' : query.trim();
  const rollArticle = createRollArticle(notation);
  const randomArticle = createRandomArticle();

  const results = [rollArticle, randomArticle].filter(
    (article): article is InlineQueryResult => article != null,
  );
  const hasInvalidQuery = notation !== '' && rollArticle == null;

  return { results, hasInvalidQuery };
}

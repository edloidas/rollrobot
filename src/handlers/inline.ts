import {
  parseAndRollSimple,
  parseClassicRoll,
  parseSimpleRoll,
  parseWodRoll,
  roll,
} from 'roll-parser';
import type { InlineQueryResult } from 'grammy/types';
import { limit } from '../limiter';
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

function createRollArticle(notation: string): InlineQueryResult | null {
  const title = 'Classic';
  const result = roll(limit(parseClassicRoll(notation || 'd20') || parseSimpleRoll(notation)));
  const message = result && createFullResultMessage(result);
  return result && message
    ? createArticle(title, result.notation, message, `${ASSET_BASE}/dnd-icon.png`)
    : null;
}

function createWodArticle(notation: string): InlineQueryResult | null {
  const title = 'World of Darkness';
  const result = roll(limit(parseWodRoll(notation || 'd10>6')));
  const message = result && createFullResultMessage(result);
  return result && message
    ? createArticle(title, result.notation, message, `${ASSET_BASE}/wod-icon.png`)
    : null;
}

function createRandomArticle(): InlineQueryResult | null {
  const title = 'Random';
  const result = parseAndRollSimple('100');
  const message = result && createFullResultMessage(result);
  return result && message
    ? createArticle(title, result.notation, message, `${ASSET_BASE}/d20-icon.png`)
    : null;
}

export function createInlineArticles(query = ''): InlineQueryResult[] {
  const notation = query.trim();
  const articles = [createRollArticle(notation), createWodArticle(notation), createRandomArticle()];
  return articles.filter((article): article is InlineQueryResult => article != null);
}

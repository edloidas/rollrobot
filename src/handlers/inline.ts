import type { InlineQueryResult } from 'grammy/types';
import { isRollParserError, roll, type RollResult } from 'roll-parser';
import { formatDetailedResult, formatResult } from '../format';
import { ROLL_LIMITS } from '../limits';
import { normalizeNotation } from '../notation';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'HTML' as const,
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

const D20_ICON = `${ASSET_BASE}/d20-icon.png`;
const DND_ICON = `${ASSET_BASE}/dnd-icon.png`;
const WOD_ICON = `${ASSET_BASE}/wod-icon.png`;

// ? Doubles as a notation discovery surface — one preset per common pattern
const PRESETS = [
  { title: 'd20', notation: 'd20', icon: D20_ICON },
  { title: 'Random', notation: 'd100', icon: D20_ICON },
  { title: 'Advantage', notation: '2d20kh1', icon: DND_ICON },
  { title: 'Ability Score', notation: '4d6kh3', icon: DND_ICON },
  { title: 'Success Pool', notation: '5d10>=6f1', icon: WOD_ICON },
] as const;

function tryRoll(notation: string): RollResult | null {
  try {
    return roll(notation, ROLL_LIMITS);
  } catch (error) {
    if (isRollParserError(error)) return null;
    throw error;
  }
}

/** Compact and detailed articles sharing one result — the choice is about display, not a reroll. */
function createQueryArticles(result: RollResult): InlineQueryResult[] {
  return [
    createArticle('Roll', result.expression, formatResult(result), D20_ICON),
    createArticle('Roll with breakdown', result.expression, formatDetailedResult(result), DND_ICON),
  ];
}

function createPresetArticles(): InlineQueryResult[] {
  return PRESETS.map(({ title, notation, icon }) => {
    const result = roll(notation);
    return createArticle(title, notation, formatDetailedResult(result), icon);
  });
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

import { Bot, type Context, GrammyError, HttpError } from 'grammy/web';
import type { InlineQueryResultsButton } from 'grammy/types';
import {
  type AnalyticsEnv,
  type Command,
  resolveSurface,
  trackCommand,
  trackRoll,
} from './analytics/track';
import { rollReply } from './handlers/roll';
import { askReply } from './handlers/ask';
import { fullReply } from './handlers/full';
import { RANDOM_NOTATION, randomReply } from './handlers/random';
import { helpReply } from './handlers/help';
import { pickReply } from './handlers/pick';
import { chosenInlineRoll, createInlineArticles, DEFAULT_NOTATION } from './handlers/inline';
import { type Locale, messages, resolveLocale } from './i18n';
import { capText, extractLabel } from './label';
import { normalizeNotation } from './notation';
import { noPermissionText } from './text';

const GROUPS = ['group', 'supergroup'];

/** A pool can run to a hundred options; the log only needs enough to recognise the call. */
const MAX_LOGGED_OPTIONS = 300;

function senderName(ctx: Context): string {
  return ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'unknown');
}

/** Echoes the request as typed: normalized notation followed by its quoted label, if any. */
function formatRequest(notation: string, label: string | null): string {
  return label == null ? notation : `${notation} "${label}"`.trim();
}

// ! User text reaches the log verbatim, and a newline in it would forge a second entry that
//   reads like a genuine one — reachable through a question and through a roll's label alike.
function oneLine(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ');
}

function logRoll(ctx: Context, command: string, request: string, reply: string): void {
  const name = senderName(ctx);
  const group = ctx.chat?.title ? ` [${ctx.chat.title}]` : '';
  const result = oneLine(reply)
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  const parts = [`${name}${group}`, `/${command}`, oneLine(request), '|', result];
  console.log(parts.filter((part) => part !== '').join(' '));
}

/**
 * Inline variants that carry no roll, mapped to the command they record.
 *
 * ! A `Map`, not an object literal. The prefix comes from a user-supplied result id, and an
 *   object lookup walks the prototype chain — `toString:x` would resolve to a function,
 *   reaching `trackCommand` as a non-string and printing a multi-line body that defeats the
 *   `oneLine` defence right above it.
 */
const SHAPELESS_VARIANTS = new Map<string, Command>([
  ['ask', 'ask'],
  ['pick', 'pick'],
]);

/** Result IDs are `<variant>:<uuid>`; unprefixed IDs predate that and cannot be attributed. */
function inlineVariant(resultId: string): string {
  const separator = resultId.indexOf(':');
  return separator > 0 ? resultId.slice(0, separator) : 'unknown';
}

function inlineHelpButton(locale: Locale): InlineQueryResultsButton {
  return { text: messages(locale).inline.help, start_parameter: 'help' };
}

function trackContext(ctx: Context, command: Command) {
  return { command, surface: resolveSurface(ctx.chat?.type), userId: ctx.from?.id };
}

function replyOptions(ctx: Context) {
  const isGroup = ctx.chat != null && GROUPS.includes(ctx.chat.type);
  return {
    parse_mode: 'HTML' as const,
    link_preview_options: { is_disabled: true },
    ...(isGroup
      ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
      : {}),
  };
}

export interface BotEnv extends AnalyticsEnv {
  TOKEN: string;
}

export function createBot(env: BotEnv): Bot {
  const bot = new Bot(env.TOKEN);

  bot.catch(async (err) => {
    const e = err.error;
    if (e instanceof GrammyError) {
      const desc = e.description;

      // Unrecoverable chat errors — log concisely, skip further handling
      if (
        (e.error_code === 400 && desc.includes('TOPIC_CLOSED')) ||
        (e.error_code === 403 && (desc.includes('kicked') || desc.includes('blocked')))
      ) {
        const who = err.ctx.from?.username
          ? `@${err.ctx.from.username}`
          : String(err.ctx.from?.id ?? '?');
        const where = err.ctx.chat?.title ?? String(err.ctx.chatId ?? '?');
        console.warn(`[${e.method}] ${e.error_code} ${who} in "${where}": ${desc}`);
        return;
      }

      console.error(`[${e.method}] ${e.error_code}: ${desc}`);
      const chatType = err.ctx.chat?.type;
      const isGroup = chatType && GROUPS.includes(chatType);
      if (e.error_code === 403 && isGroup && desc.includes('rights')) {
        const userId = err.ctx.from?.id;
        if (userId) {
          try {
            const chatName = err.ctx.chat?.title;
            await err.ctx.api.sendMessage(userId, noPermissionText(chatName), {
              parse_mode: 'HTML',
            });
          } catch {
            // User hasn't started the bot — nothing we can do
          }
        }
      }
    } else if (e instanceof HttpError) {
      console.error(`Network error: ${e.message}`);
    } else {
      console.error(`Error handling update ${err.ctx.update.update_id}:`, e);
    }
  });

  async function replyHelp(ctx: Context, command: 'start' | 'help'): Promise<void> {
    await ctx.reply(helpReply(resolveLocale(ctx.from?.language_code)), replyOptions(ctx));
    await trackCommand(env, trackContext(ctx, command));
  }

  bot.command('start', (ctx) => replyHelp(ctx, 'start'));
  bot.command('help', (ctx) => replyHelp(ctx, 'help'));

  bot.command(['roll', 'r'], async (ctx) => {
    const { notation: rest, label } = extractLabel((ctx.match as string) ?? '');
    const notation = normalizeNotation(rest);
    const { text, result } = rollReply(notation, label);
    logRoll(ctx, 'roll', formatRequest(notation, label), text);
    await ctx.reply(text, replyOptions(ctx));
    await trackRoll(env, trackContext(ctx, 'roll'), result);
  });

  bot.command(['full', 'f'], async (ctx) => {
    const { notation: rest, label } = extractLabel((ctx.match as string) ?? '');
    const notation = normalizeNotation(rest);
    const { text, result } = fullReply(notation, label);
    logRoll(ctx, 'full', formatRequest(notation, label), text);
    await ctx.reply(text, replyOptions(ctx));
    await trackRoll(env, trackContext(ctx, 'full'), result);
  });

  bot.command(['ask', 'a'], async (ctx) => {
    const { text, question } = askReply((ctx.match as string) ?? '');
    logRoll(ctx, 'ask', question ?? '', text);
    await ctx.reply(text, replyOptions(ctx));
    await trackCommand(env, trackContext(ctx, 'ask'));
  });

  bot.command(['pick', 'p'], async (ctx) => {
    const input = (ctx.match as string) ?? '';
    const { text } = pickReply(input, resolveLocale(ctx.from?.language_code));
    // Capped like `/ask` quotes its question — a hundred options would otherwise land whole
    logRoll(ctx, 'pick', capText(input, MAX_LOGGED_OPTIONS), text);
    await ctx.reply(text, replyOptions(ctx));
    await trackCommand(env, trackContext(ctx, 'pick'));
  });

  bot.command('random', async (ctx) => {
    const { label } = extractLabel((ctx.match as string) ?? '');
    const { text, result } = randomReply(label);
    logRoll(ctx, 'random', formatRequest(RANDOM_NOTATION, label), text);
    await ctx.reply(text, replyOptions(ctx));
    await trackRoll(env, trackContext(ctx, 'random'), result);
  });

  // ! Not `inline_query` — it fires per keystroke and would measure typing speed.
  bot.on('chosen_inline_result', async (ctx) => {
    const name = senderName(ctx);
    const { query, result_id } = ctx.chosenInlineResult;
    const variant = inlineVariant(result_id);

    // An answer and a pick have no dice shape to record, and the roll path's
    // `?? roll(DEFAULT_NOTATION)` fallback would invent a phantom d20 term for either
    const shapeless = SHAPELESS_VARIANTS.get(variant);
    if (shapeless != null) {
      console.log(`${name} [inline] ${shapeless} ${oneLine(query)}`);
      await trackCommand(env, { command: shapeless, surface: 'inline', userId: ctx.from?.id });
      return;
    }

    const { notation: queried, label } = extractLabel(query);
    const notation = variant === 'random' ? RANDOM_NOTATION : queried || DEFAULT_NOTATION;
    console.log(`${name} [inline] ${variant} ${formatRequest(notation, label)}`);

    const context = { command: 'inline', surface: 'inline', userId: ctx.from?.id } as const;
    await trackRoll(env, context, () => chosenInlineRoll(query, variant));
  });

  bot.on('inline_query', async (ctx) => {
    const locale = resolveLocale(ctx.from?.language_code);
    const { results, hasInvalidQuery } = createInlineArticles(ctx.inlineQuery.query, locale);
    await ctx.answerInlineQuery(results, {
      cache_time: 0,
      is_personal: true,
      ...(hasInvalidQuery ? { button: inlineHelpButton(locale) } : {}),
    });
  });

  return bot;
}

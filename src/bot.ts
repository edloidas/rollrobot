import { Bot, type Context, GrammyError, HttpError } from 'grammy';
import type { InlineQueryResultsButton } from 'grammy/types';
import { rollReply } from './handlers/roll';
import { fullReply } from './handlers/full';
import { randomReply } from './handlers/random';
import { helpReply } from './handlers/help';
import { deprecatedReply } from './handlers/deprecated';
import { createInlineArticles } from './handlers/inline';
import { noPermissionText } from './text';

const GROUPS = ['group', 'supergroup'];

function logRoll(ctx: Context, command: string, notation: string, reply: string): void {
  const name = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'unknown');
  const group = ctx.chat?.title ? ` [${ctx.chat.title}]` : '';
  const result = reply.replace(/[`*_]/g, '');
  console.log(`${name}${group} /${command}: ${notation} | ${result}`);
}

const INLINE_HELP_BUTTON: InlineQueryResultsButton = {
  text: 'How to use',
  start_parameter: 'help',
};

function replyOptions(ctx: Context) {
  const isGroup = ctx.chat != null && GROUPS.includes(ctx.chat.type);
  return {
    parse_mode: 'Markdown' as const,
    link_preview_options: { is_disabled: true },
    ...(isGroup
      ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
      : {}),
  };
}

export function createBot(token: string): Bot {
  const bot = new Bot(token);

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
              parse_mode: 'Markdown',
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

  bot.command(['start', 'help'], async (ctx) => {
    await ctx.reply(helpReply(), replyOptions(ctx));
  });

  bot.command('roll', async (ctx) => {
    const notation = (ctx.match as string) || 'd20';
    const reply = rollReply(notation);
    logRoll(ctx, 'roll', notation, reply);
    await ctx.reply(reply, replyOptions(ctx));
  });

  bot.command('full', async (ctx) => {
    const notation = (ctx.match as string) || 'd20';
    const reply = fullReply(notation);
    logRoll(ctx, 'full', notation, reply);
    await ctx.reply(reply, replyOptions(ctx));
  });

  bot.command('random', async (ctx) => {
    const reply = randomReply();
    logRoll(ctx, 'random', 'd100', reply);
    await ctx.reply(reply, replyOptions(ctx));
  });

  bot.command(['sroll', 'droll'], async (ctx) => {
    await ctx.reply(deprecatedReply(), replyOptions(ctx));
  });

  bot.on('chosen_inline_result', (ctx) => {
    const name = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'unknown');
    const query = ctx.chosenInlineResult.query || 'd20';
    console.log(`${name} [inline]: ${query}`);
  });

  bot.on('inline_query', async (ctx) => {
    const { results, hasInvalidQuery } = createInlineArticles(ctx.inlineQuery.query);
    await ctx.answerInlineQuery(results, {
      cache_time: 0,
      is_personal: true,
      ...(hasInvalidQuery ? { button: INLINE_HELP_BUTTON } : {}),
    });
  });

  return bot;
}

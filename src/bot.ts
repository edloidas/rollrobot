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
      console.error(`[${e.method}] ${e.error_code}: ${e.description}`);
      const chatType = err.ctx.chat?.type;
      const isGroup = chatType && GROUPS.includes(chatType);
      if (e.error_code === 403 && isGroup && e.description.includes('rights')) {
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
    const notation = (ctx.match as string) || '';
    await ctx.reply(rollReply(notation), replyOptions(ctx));
  });

  bot.command('full', async (ctx) => {
    const notation = (ctx.match as string) || '';
    await ctx.reply(fullReply(notation), replyOptions(ctx));
  });

  bot.command('random', async (ctx) => {
    await ctx.reply(randomReply(), replyOptions(ctx));
  });

  bot.command(['sroll', 'droll'], async (ctx) => {
    await ctx.reply(deprecatedReply(), replyOptions(ctx));
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

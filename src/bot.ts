import { Bot } from 'grammy';
import { rollReply } from './handlers/roll';
import { fullReply } from './handlers/full';
import { randomReply } from './handlers/random';
import { helpReply } from './handlers/help';
import { deprecatedReply } from './handlers/deprecated';
import { createInlineArticles } from './handlers/inline';

const GROUPS = ['group', 'supergroup', 'channel'];

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.catch((err) => {
    console.error(`Error handling update ${err.ctx.update.update_id}:`, err.error);
  });

  bot.command(['start', 'help'], async (ctx) => {
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(helpReply(), {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup
        ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
        : {}),
    });
  });

  bot.command('roll', async (ctx) => {
    const notation = (ctx.match as string) || '';
    const response = rollReply(notation);
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup
        ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
        : {}),
    });
  });

  bot.command('full', async (ctx) => {
    const notation = (ctx.match as string) || '';
    const response = fullReply(notation);
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup
        ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
        : {}),
    });
  });

  bot.command('random', async (ctx) => {
    const response = randomReply();
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup
        ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
        : {}),
    });
  });

  bot.command(['sroll', 'droll'], async (ctx) => {
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(deprecatedReply(), {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup
        ? { reply_parameters: { message_id: ctx.msgId, allow_sending_without_reply: true } }
        : {}),
    });
  });

  bot.on('inline_query', async (ctx) => {
    const results = createInlineArticles(ctx.inlineQuery.query);
    await ctx.answerInlineQuery(results, { cache_time: 0 });
  });

  return bot;
}

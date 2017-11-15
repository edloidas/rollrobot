const { inline, roll, full, random, help, deprecated } = require('./query');
const { createOptions, createInlineOptions } = require('./options');
const { error } = require('./text');

/*
More event type are described in official API of `node-telegram-bot-api`
https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
*/

function createHandler(bot, query, track) {
  const { regexp, reply, title } = query;

  bot.onText(regexp, (msg, match) => {
    try {
      const { id } = msg.chat;
      const notation = ((match && match[3]) || '').trim();
      const response = reply(notation) || error;
      const options = createOptions(msg);
      bot.sendMessage(id, response, options);
      track(msg, title);
    } catch (e) {
      console.error(e);
    }
  });
}

function createInlineHandler(bot, track) {
  const { createInlineArticles } = inline;

  bot.on('inline_query', msg => {
    try {
      const { id, query } = msg;
      const options = createInlineOptions();
      const results = createInlineArticles(query);
      bot.answerInlineQuery(id, results, options);
    } catch (e) {
      console.error(e);
    }
  });

  bot.on('chosen_inline_result', msg => {
    try {
      track(msg);
    } catch (e) {
      console.error(e);
    }
  });
}

function initHandlers(bot, analytics) {
  const { track, trackInline } = analytics;
  createInlineHandler(bot, trackInline);
  createHandler(bot, roll, track);
  createHandler(bot, full, track);
  createHandler(bot, random, track);
  createHandler(bot, help, track);
  createHandler(bot, deprecated, track);
}

module.exports = {
  initHandlers
};

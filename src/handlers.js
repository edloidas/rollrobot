const { inline, roll, full, random, help, deprecated } = require('./query');
const { createOptions, createInlineOptions } = require('./options');
const { error } = require('./text');

function createHandler(bot, query) {
  const { regexp, reply } = query;

  bot.onText(regexp, (msg, match) => {
    try {
      const { id } = msg.chat;
      const notation = ((match && match[3]) || '').trim();
      const response = reply(notation) || error;
      const options = createOptions(msg);
      bot.sendMessage(id, response, options);
    } catch (e) {
      console.error(e);
    }
  });
}

function createInlineHandler(bot) {
  const { createInlineArticles } = inline;

  bot.onText('inline_query', msg => {
    try {
      const { id, query } = msg;
      const options = createInlineOptions();
      const results = createInlineArticles(query);
      bot.answerInlineQuery(id, results, options);
    } catch (e) {
      console.error(e);
    }
  });
}

function initHandlers(bot) {
  createInlineHandler(bot);
  createHandler(bot, roll);
  createHandler(bot, full);
  createHandler(bot, random);
  createHandler(bot, help);
  createHandler(bot, deprecated);
}

module.exports = {
  initHandlers
};

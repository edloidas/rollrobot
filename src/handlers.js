const { roll, full, random, help, deprecated } = require('./query');
const { createOptions /* , createInlineOptions */ } = require('./options');
const { error } = require('./text');

function createHandler(bot, query) {
  const { regexp, reply } = query;

  bot.onText(regexp, (msg, match) => {
    const { id } = msg.chat;
    const notation = ((match && match[3]) || '').trim();
    const response = reply(notation) || error;
    const options = createOptions(msg);
    bot.sendMessage(id, response, options);
  });
}

// function createInlineHandler(bot) {
//   bot.onText('inline_query', msg => msg);
// }

function initHandlers(bot) {
  // createInlineHandler(bot, inline);
  createHandler(bot, roll);
  createHandler(bot, full);
  createHandler(bot, random);
  createHandler(bot, help);
  createHandler(bot, deprecated);
}

module.exports = {
  initHandlers
};

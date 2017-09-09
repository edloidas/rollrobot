const TelegramBot = require('node-telegram-bot-api');
const { initHandlers } = require('../src/handlers');

function createBot() {
  const bot = new TelegramBot('0123456789abcdef', {});
  initHandlers(bot);

  return bot;
}

module.exports = {
  createBot
};

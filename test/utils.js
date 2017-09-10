const TelegramBot = require('node-telegram-bot-api');
const EnchancedTelegramTest = require('./EnhancedTelegramTest');
const { initHandlers } = require('../src/handlers');

function createBot() {
  const bot = new TelegramBot('0123456789abcdef', { webhook: true });
  initHandlers(bot);

  return bot;
}

function createTestServer() {
  const bot = createBot();
  return new EnchancedTelegramTest(bot);
}

module.exports = {
  createBot,
  createTestServer
};

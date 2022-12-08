const TelegramBot = require('node-telegram-bot-api');
const EnchancedTelegramTest = require('./EnhancedTelegramTest');
const { initHandlers } = require('../src/handlers');

function createBot() {
  return new TelegramBot('0123456789abcdef', { webhook: true });
}

function createTestServer() {
  const bot = createBot();
  initHandlers(bot);
  return new EnchancedTelegramTest(bot);
}

module.exports = {
  createBot,
  createTestServer
};

const TelegramBot = require('node-telegram-bot-api');
const EnchancedTelegramTest = require('./EnhancedTelegramTest');
const { track, trackInline } = require('../src/analytics');
const { initHandlers } = require('../src/handlers');

function createBot() {
  return new TelegramBot('0123456789abcdef', { webhook: true });
}

function createTestServer(callback) {
  const bot = createBot();
  const analytics = {
    track: (msg, name) => track(msg, name, callback),
    trackInline: msg => trackInline(msg, callback)
  };
  initHandlers(bot, analytics);
  return new EnchancedTelegramTest(bot);
}

module.exports = {
  createBot,
  createTestServer
};

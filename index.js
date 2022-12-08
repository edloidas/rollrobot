const TelegramBot = require('node-telegram-bot-api');
const { initHandlers } = require('./src/handlers');
const CONFIG = require('./src/config');

const { token, settings, telegram } = CONFIG;
const URL = `${telegram.host}:${telegram.port}/bot${token}`;

try {
  console.log(`Starting bot on URL: ${URL}`);
  const bot = new TelegramBot(token, settings);
  bot.setWebHook(URL);
  initHandlers(bot);
} catch (e) {
  console.log(e);
}

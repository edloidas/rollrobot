const TelegramBot = require('node-telegram-bot-api');
const analytics = require('./src/analytics');
const { initHandlers } = require('./src/handlers');
const CONFIG = require('./src/config');

const { token, settings, telegram } = CONFIG;
const URL = `${telegram.host}:${telegram.port}/bot${token}`;

const bot = new TelegramBot(token, settings);
bot.setWebHook(URL);
initHandlers(bot, analytics);

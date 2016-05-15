const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );
const message = require( './src/message' );

const { token, options, telegram } = CONFIG;
const URL = `${telegram.host}:${telegram.port}/bot${token}`;

const bot = new TelegramBot( token, options );
bot.setWebHook( URL );

// /start
bot.onText( /\/start/, ( msg ) => {
  let fromId = msg.from.id;
  let { resp, options } = message.start;
  bot.sendMessage( fromId, resp, options );
});

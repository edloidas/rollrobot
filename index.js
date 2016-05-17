const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );
const message = require( './src/message' );

const { token, settings, telegram } = CONFIG;
const URL = `${ telegram.host }:${ telegram.port }/bot${ token }`;

const bot = new TelegramBot( token, settings );
bot.setWebHook( URL );

// /start
bot.onText( message.type.start.regexp, ( msg ) => {
  const fromId = msg.from.id;
  const { resp, options } = message.type.start;
  bot.sendMessage( fromId, resp, options );
});

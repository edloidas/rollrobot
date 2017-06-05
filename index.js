const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );

const { token, settings, telegram } = CONFIG;
const URL = `${ telegram.host }:${ telegram.port }/bot${ token }`;

const bot = new TelegramBot( token, settings );
bot.setWebHook( URL );

bot.onText( regexp, handler );

// inline queries
bot.on( 'inline_query', ( msg ) => {
  const { id, query } = msg;
  const { options } = message.type.inline;
  const results = message.getInlineArticles( query );
  bot.answerInlineQuery( id, results, options );
});

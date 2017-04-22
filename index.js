const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );

const { token, settings, telegram } = CONFIG;
const URL = `${ telegram.host }:${ telegram.port }/bot${ token }`;

const bot = new TelegramBot( token, settings );
bot.setWebHook( URL );

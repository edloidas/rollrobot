const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );
const message = require( './src/message' );

const { token, settings, telegram } = CONFIG;
const URL = `${ telegram.host }:${ telegram.port }/bot${ token }`;

const bot = new TelegramBot( token, settings );
bot.setWebHook( URL );

// /start
bot.onText( message.type.start.regexp, ( msg ) => {
  const id = msg.chat.id;
  const { resp, options } = message.type.start;
  bot.sendMessage( id, resp, options );
});

function commonRollHandler( type, msg, match ) {
  const id = msg.chat.id;
  const username = msg.from ? msg.from.username : msg.chat.username;
  try {
    const { resp, options } = message.getMessageBody( type, username, match[ 2 ]);
    bot.sendMessage( id, resp, options );
  } catch ( err ) {
    bot.sendMessage( id, message.getErrorMessage( username ));
  }
}

// /roll  /sroll  /droll  /random
[ 'roll', 'sroll', 'droll', 'random' ].forEach(( type ) => {
  bot.onText( message.type[ type ].regexp, commonRollHandler.bind( null, type ));
});

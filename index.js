const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );
const message = require( './src/message' );
const dice = require( './src/dice' );

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

function commonRollHandler( type, msg, match ) {
  const { id, username } = msg.from;

  try {
    const values = message.parse( match[ 2 ], type );
    const { view, result } = dice.namedRoll( type, values );

    const resp = message.getResponse( username, view, result );
    const options = message.type[ type ];

    bot.sendMessage( id, resp, options );
  } catch ( err ) {
    bot.sendMessage( id, message.getErrorMessage( username ));
  }
}

// /roll  /sroll  /droll  /random
[ 'roll', 'sroll', 'droll', 'random' ].forEach(( type ) => {
  bot.onText( message.type[ type ].regexp, commonRollHandler.bind( null, type ));
});

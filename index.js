const TelegramBot = require( 'node-telegram-bot-api' );
const CONFIG = require( './src/config' );
const message = require( './src/message' );

const { token, settings, telegram } = CONFIG;
const URL = `${ telegram.host }:${ telegram.port }/bot${ token }`;

const bot = new TelegramBot( token, settings );
bot.setWebHook( URL );

function commonHelpHandler( type, msg ) {
  const id = msg.chat.id;
  const { resp, options } = message.type[ type ];
  bot.sendMessage( id, resp, options );
}

function commonRollHandler( type, msg, match ) {
  const id = msg.chat.id;
  try {
    const { resp, options } = message.getMessageBody( type, msg, match[ 2 ], true );
    bot.sendMessage( id, resp, options );
  } catch ( err ) {
    bot.sendMessage( id, message.getErrorMessage( msg ));
  }
}

// /start  /help
[ 'start', 'help' ].forEach(( type ) => {
  bot.onText( message.type[ type ].regexp, commonHelpHandler.bind( null, type ));
});

// /roll  /sroll  /droll  /random
[ 'roll', 'sroll', 'droll', 'random' ].forEach(( type ) => {
  bot.onText( message.type[ type ].regexp, commonRollHandler.bind( null, type ));
});

// inline queries
bot.on( 'inline_query', ( msg ) => {
  const { id, query, offset } = msg;
  console.log( `Inline ${ id } :: ${ query }` );
  console.log( `  offset :: ${ offset }` );

  const results = [];

  const InlineQueryResultArticle = {
    type: 'article',
    title: 'Title',
    input_message_content: {
      message_text: 'MessageBody',
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    },
    hide_url: true,
  };

  results.push( InlineQueryResultArticle );

  bot.answerInlineQuery( id, results );
});

bot.on( 'chosen_inline_result', ( msg ) => {
  console.log( `Chosen: ${ msg }` );
});

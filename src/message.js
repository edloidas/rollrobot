/* eslint max-len: ["error", 100, { "ignorePattern": "^[\s\w:]+\/.+\/" }] */
const compact = require( 'lodash.compact' );
const dice = require( './dice' );
const helpText = require( './text/help' );
const InlineQueryResultArticle = require( './types/InlineQueryResultArticle' );
const InputTextMessageContent = require( './types/InputTextMessageContent' );

function Message() {
  this.type = {
    start: {
      regexp: /^(\/start){1}(?:@rollrobot)?(?:\s+\S*)*$/,
      resp: helpText,
      options: {
        disable_web_page_preview: true,
      },
    },
    help: {
      regexp: /^(\/help){1}(?:@rollrobot)?(?:\s+\S*)*$/,
      resp: helpText,
      options: {
        disable_web_page_preview: true,
      },
    },
    roll: {
      // For values: none || x || x y || x y n || x y -n
      regexp: /^(?:(\/roll){1}(?:@rollrobot)?((?:(?:\s+\d+){2}(?:\s+-\d+))|(?:\s+\d+){0,3}))(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    sroll: {
      regexp: /^(\/sroll){1}(?:@rollrobot)?(\s+-?\d+)?(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    droll: {
      regexp: /^(\/droll){1}(?:@rollrobot)?(\s+-?\d+)?(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    random: {
      regexp: /^(\/random){1}(?:@rollrobot)?(\s+\d+)?(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    inline: {
      // ?: and parenthesis are used to follow the common rule to return values on match[ 2 ]
      regexp: /^(\s*(-?((?:(?:\d+\s+){2}(?:-\d+))|(?:\d+\s*){0,3})))(?:\s+\S*)*$/,
      parse_mode: 'Markdown',
      options: {
        cache_time: 0,
      },
    },
  };

  this.error = 'Request encountered an error.';
}

Message.prototype.parse = function parse( msg, type ) {
  switch ( type ) {
    case 'inline':
      return compact( msg.split( ' ' )).map( value => parseInt( value, 10 ));
    case 'roll':
      return compact( msg.split( ' ' )).map( value => parseInt( value, 10 ));
    case 'sroll':
      return compact([ parseInt( msg, 10 ) ]);
    case 'droll':
      return compact([ parseInt( msg, 10 ) ]);
    case 'random':
      return compact([ parseInt( msg, 10 ) ]);
    case 'start':
      return [];
    case 'help':
      return [];
    default:
      return null;
  }
};

Message.prototype.matchAndParse = function matchAndParse( msg, type ) {
  let match;
  const isRoll = [ 'inline', 'roll', 'sroll', 'droll', 'random' ].indexOf( type ) !== -1;

  if ( isRoll ) {
    match = msg.match( this.type[ type ].regexp )[ 2 ];
  }

  return this.parse( match, type );
};

Message.prototype.getResponse = function getResponse( msg, view, result, reply ) {
  // Channel or a reply
  if ( !msg || !msg.from || reply || msg.chat.username === 'rollrobot' ) {
    return `\`(${ view })\` *${ result }*`;
  }
  let fullname = `${ msg.from.first_name || '' } ${ msg.from.last_name || '' }`.trim();
  fullname = fullname.length ? `${ fullname } ` : '';
  const username = msg.from.username;
  return `_${ fullname }_@${ username } \`(${ view })\` *${ result }*`;
};

Message.prototype.getErrorMessage = function getErrorMessage( msg ) {
  const username = msg.from ? msg.from.username : msg.chat.username;
  return `@${ username } : \`(${ this.error })\``;
};

Message.prototype.getMessageBody = function getMessageBody( type, msg, matchedValues, reply ) {
  const values = this.parse( matchedValues, type );
  const { view, result } = dice.namedRoll( type, values );

  const resp = this.getResponse( msg, view, result, reply );
  const options = {};
  Object.assign( options, this.type[ type ].options );
  const isInGroup = [ 'group', 'supergroup', 'channel' ].indexOf( msg.chat.type ) !== -1;
  if ( reply && isInGroup ) {
    options.reply_to_message_id = msg.message_id;
  }
  return { resp, options };
};

Message.prototype.getInlineArticle = function getInlineArticle( type, values ) {
  const isInvalid = !values || ( values[ 0 ] < 0 && [ 'roll', 'random' ].indexOf( type ) !== -1 );
  if ( isInvalid ) {
    return null;
  }

  const parseMode = this.type.inline.parse_mode;
  const { view, result } = dice.namedRoll( type, values );
  const resp = this.getResponse( null, view, result );
  const inlineMessage = new InputTextMessageContent( resp, parseMode );
  const inlineArticle = new InlineQueryResultArticle( `/${ type }`, view, inlineMessage );

  return inlineArticle;
};

Message.prototype.getInlineArticles = function getInlineArticles( query ) {
  let values = this.matchAndParse( query, 'inline' );
  const results = [];

  // multiple values with first negative may result empty array of articles
  values = ( values.length >= 2 && values[ 0 ] < 0 ) ? [ values[ 0 ] ] : values;

  results.push( this.getInlineArticle( 'roll', values ));
  if ( values.length < 2 ) {
    results.push( this.getInlineArticle( 'sroll', values ));
    results.push( this.getInlineArticle( 'droll', values ));
    results.push( this.getInlineArticle( 'random', values ));
  }

  return compact( results );
};

module.exports = new Message();

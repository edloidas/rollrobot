const compact = require( 'lodash' ).compact;
const dice = require( './dice' );
const helpText = require( './text/help' );

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
      regexp: /^(?:(\/roll){1}(?:@rollrobot)?((?:\s+\d+){0,3}))(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    sroll: {
      regexp: /^(\/sroll){1}(?:@rollrobot)?(\s+\d+)?(?:\s+\S*)*$/,
      options: {
        parse_mode: 'Markdown',
      },
    },
    droll: {
      regexp: /^(\/droll){1}(?:@rollrobot)?(\s+\d+)?(?:\s+\S*)*$/,
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
  };

  this.error = 'Request encountered an error.';
}

Message.prototype.parse = function parse( msg, type ) {
  switch ( type ) {
    case 'roll':
      return compact( msg.split( ' ' )).map(( value ) => parseInt( value, 10 )) || [];
    case 'sroll':
      return compact([ parseInt( msg, 10 ) ]) || [];
    case 'droll':
      return compact([ parseInt( msg, 10 ) ]) || [];
    case 'random':
      return compact([ parseInt( msg, 10 ) ]) || [];
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
  const isRoll = [ 'roll', 'sroll', 'droll', 'random' ].indexOf( type ) !== -1;

  if ( isRoll ) {
    match = msg.match( this.type[ type ].regexp )[ 2 ];
  }

  return this.parse( match, type );
};

Message.prototype.getResponse = function getResponse( msg, view, result, reply ) {
  // Channel or a reply
  if ( !msg.from || reply || msg.chat.username === 'rollrobot' ) {
    return `\`(${ view })\` *${ result }*`;
  }
  let fullname = `${ msg.from.first_name } ${ msg.from.last_name }`.trim();
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

module.exports = new Message();

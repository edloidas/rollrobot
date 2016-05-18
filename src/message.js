const compact = require( 'lodash' ).compact;
const dice = require( './dice' );

function Message() {
  this.type = {
    start: {
      regexp: /^(\/start){1}(?:@rollrobot)?(?:\s+\S*)*$/,
      resp: `Roll the dice like no one before. Flexible settings allow you to generate random numbers by the following pattern (x)d(y)+(n), where (x) is number of dices, (y) related to the number of dice edges and (n) is a number that should be added to the randomly generated number.\nBot recognizes and interacts with several commands, such as:\n\n/roll (x) (y) (n) -- 2d10+0, x=2, y=10, n=0 by default.\n/sroll (n) -- 2d6+(n), n=0 by default\n/droll (n) -- 2d20+(n), n=0 by default\n/random (y) -- 1d100+0, y=100 by default\n\nYou can manually modify the pattern by writing command, such as /roll 2 10 5, which meand bot will make roll of 2 10-edged dices and add 5 to the result.\nOther examples:\nroll 1 -- 1d10\nroll 4 6 5 -- 4d6+10\ndroll 3 -- 2d20+3\nrandom -- 1d100\nrandom 300 -- 1d300\n\n\nSimply open the bot's profile and use the 'Add to group' button.\n\nWe wish you have much fun using our Roll Robot in your RPgames.\n\nYour ideas on improvement are welcome: https://github.com/edloidas/rollrobot/issues\n\nRoll Robot team,\n@edloidas \n\nSpecial thx to @nartien`,
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
    case 'start':
      return [];
    case 'roll':
      return compact( msg.split( ' ' )).map(( value ) => parseInt( value, 10 )) || [];
    case 'sroll':
      return compact([ parseInt( msg, 10 ) ]) || [];
    case 'droll':
      return compact([ parseInt( msg, 10 ) ]) || [];
    case 'random':
      return compact([ parseInt( msg, 10 ) ]) || [];
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
  const isInGroup = [ 'group', 'supergroup', 'channel' ].indexOf( msg.chat.type ) === -1;
  if ( reply && isInGroup ) {
    options.reply_to_message_id = msg.message_id;
  }
  return { resp, options };
};

module.exports = new Message();

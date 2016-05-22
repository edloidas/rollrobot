const rand = require( './random' );
const { MAX_SAFE_INTEGER, MIN_SAFE_INTEGER } = Number;

// Dice is an 'object', that can be rolled to geerate random numbers.
// All 'roll' functions follow the same pattern: (x)k(y)+(n), where
// (n) - is number of dices
// (y) - related to the number of dice edges
// (n) - is a number that should be added to the result
function Dice() {}


Dice.prototype.reviseValue = function reviseValue( value = 0, max = MAX_SAFE_INTEGER, min = 0 ) {
  let val = parseInt( value, 10 );
  val = isNaN( val ) ? 0 : val;
  return Math.max( min, Math.min( val, max ));
};

Dice.prototype.roll = function roll( x = 2, y = 10, n = 0 ) {
  const safeX = this.reviseValue( x, 12, 1 );
  const safeY = this.reviseValue( y, MAX_SAFE_INTEGER, 1 );
  const safeN = this.reviseValue( n, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER );

  let result = safeN;

  for ( let i = 0; i < safeX; i++ ) {
    result += rand.getRandomPositiveInt( safeY );
  }

  result = result < 0 ? 0 : result;

  return {
    view: `${ safeX }d${ safeY }${ safeN < 0 ? '' : '+' }${ safeN }`,
    result,
  };
};

Dice.prototype.namedRoll = function namedRoll( type = 'roll', values = []) {
  switch ( type ) {
    case 'inline':
      return this.roll( ...values );
    case 'roll':
      return this.roll( ...values );
    case 'sroll':
      return this.roll( 2, 6, values[ 0 ]);
    case 'droll':
      return this.roll( 2, 20, values[ 0 ]);
    case 'random':
      return this.roll( 1, values[ 0 ] || 100 );
    default:
      return null;
  }
};

module.exports = new Dice();

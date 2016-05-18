const rand = require( './random' );
// Dice is an 'object', that can be rolled to geerate random numbers.
// All 'roll' functions follow the same pattern: (x)k(y)+(n), where
// (n) - is number of dices
// (y) - related to the number of dice edges
// (n) - is a number that should be added to the result
function Dice() {}

Dice.prototype.reviseValue = function reviseValue( value = 0, limit = Number.MAX_SAFE_INTEGER ) {
  let val = parseInt( value, 10 );
  val = isNaN( val ) ? 0 : val;
  return Math.max( 0, Math.min( val, limit ));
};

Dice.prototype.random = function random( y ) {
  return rand.getRandomPositiveInt( y );
};

Dice.prototype.roll = function random( x = 2, y = 10, n = 0 ) {
  const safeX = this.reviseValue( x, 10000 ) || 1;
  const safeY = this.reviseValue( y ) || 1;
  const safeN = this.reviseValue( n );

  let result = safeN;

  for ( let i = 0; i < safeX; i++ ) {
    result += this.random( safeY );
  }

  return {
    view: `${ safeX }d${ safeY }+${ safeN }`,
    result,
  };
};

Dice.prototype.namedRoll = function namedRoll( type = 'roll', values = []) {
  switch ( type ) {
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

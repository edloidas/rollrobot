const random = require( './random' );
// Dice is an 'object', that can be rolled to geerate random numbers.
// All 'roll' functions follow the same pattern: (x)k(y)+(n), where
// (n) - is number of dices
// (y) - related to the number of dice edges
// (n) - is a number that should be added to the result
function Dice() {};

Dice.prototype.random = function ( y ) {
  return random.getRandomPositiveInt( y );
};

module.exports = new Dice();

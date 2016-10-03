const MIN_INT = Number.MIN_SAFE_INTEGER;
const MAX_INT = Number.MAX_SAFE_INTEGER;

function Random() {}

// ( min, max )
Random.prototype.getRandomInt = function getRandomInt( min = MIN_INT, max = MAX_INT ) {
  return Math.floor( Math.random() * ( max - min )) + min;
};

// ( 1, max ]
Random.prototype.getRandomPositiveInt = function getRandomPositiveInt( max ) {
  return this.getRandomInt( 1, max + 1 );
};

Random.prototype.getRandomId = function getRandomId( length = 18, radix = 10 ) {
  let id = Math.random().toString( radix ).substr( 2, length );
  const lastIndex = id.length - 1;
  id = id.length < length ? ( id + new Array( length - lastIndex ).join( '0' )) : id;
  return id;
};

module.exports = new Random();

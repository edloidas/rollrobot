function Random() {}

// ( min, max )
Random.prototype.getRandomInt = function getRandomInt( min, max ) {
  return Math.floor( Math.random() * ( max - min )) + min;
};

// ( 1, max ]
Random.prototype.getRandomPositiveInt = function getRandomPositiveInt( max ) {
  return this.getRandomInt( 1, max + 1 );
};

Random.prototype.getRandomId = function getRandomId( length = 18, radix = 10 ) {
  let id = Math.random().toString( radix ).substr( 2, length );
  id = id.length < length ? ( id + new Array( length - id.length + 1 ).join( '0' )) : id;
  return id;
};

module.exports = new Random();

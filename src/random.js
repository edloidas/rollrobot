function Random() {};

// ( min, max )
Random.prototype.getRandomInt = function ( min, max ) {
    return Math.floor( Math.random() * ( max - min )) + min;
  },

// ( 1, max ]
Random.prototype.getRandomPositiveInt = function ( max ) {
    return this.getRandomInt( 1, max + 1 );
  }

module.exports = new Random();

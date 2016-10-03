const should = require( 'should' );
const random = require( '../../src/random' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Random.getRandomInt', () => {
  const msg = 'should always generate negatives';
  it( msg, ( done ) => {
    const result = [];
    for ( let i = 0; i < 10; i++ ) {
      result.push( random.getRandomInt( -10, -1 ));
    }

    result.should.matchEach( value => value.should.be.below( 0 ));
    done();
  });
});

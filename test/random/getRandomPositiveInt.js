const should = require( 'should' );
const random = require( '../../src/random' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Random.getRandomPositiveInt', () => {
  const msg = 'should always generate 1 on (1,1]';
  it( msg, ( done ) => {
    const result = [];
    for ( let i = 0; i < 10; i++ ) {
      result.push( random.getRandomPositiveInt( 1 ));
    }

    result.should.matchEach( 1 );
    done();
  });
});

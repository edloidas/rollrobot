const should = require('should');
const random = require( '../src/random' );

describe( 'Random.getRandomPositiveInt', () => {
  let msg = 'should always generate 1 on (1,1]';
	it( msg, ( done ) => {
    let result = [];
    for ( let i = 0; i < 10; i++ ) {
      result.push( random.getRandomPositiveInt( 1 ));
    }

    result.should.matchEach( 1 );
    done();
  });
});

const should = require( 'should' );
const random = require( '../../src/random' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Random.getRandomId', () => {
  function checkRandomId( msg, radix = 10, length = 18 ) {
    it( msg, ( done ) => {
      const result = [];
      for ( let i = 0; i < 10; i++ ) {
        result.push( random.getRandomId( length, radix ));
      }
      result.should.matchEach(( value ) => value.length.should.be.equal( length ));
      done();
    });
  }

  let msg = 'should generate valid id for radix=10, length=18';
  checkRandomId( msg );

  msg = 'should generate valid id for radix=10, length=30';
  checkRandomId( msg, 10, 30 );

  msg = 'should generate valid id for radix=10, length=7';
  checkRandomId( msg, 7 );

  msg = 'should generate valid id for radix=2, length=30';
  checkRandomId( msg, 30, 2 );
});

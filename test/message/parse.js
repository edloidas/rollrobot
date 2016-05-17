const should = require( 'should' );
// const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.parse()', () => {
  describe( '/roll 1 2 3', () => {
    it( 'should parse', ( done ) => {
      done();
    });
  });
});

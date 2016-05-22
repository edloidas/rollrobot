const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.parse()', () => {
  const parse = message.parse.bind( message );

  // Unrecognized
  const msg = 'should not be recognized';
  describe( msg, () => {
    const types = [
      null, 'inline2', 'rolll',
      'roll ', 'asdf', '',
    ];

    types.forEach(( type ) => it( `[ '${ type }' ]`, ( done ) => {
      const values = parse( null, type );
      should.not.exist( values );
      done();
    }));
  });
});

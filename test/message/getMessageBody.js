const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.getMessageBody', () => {
  const msg = 'generate valid response';
  describe( msg, () => {
    [ 'roll', 'sroll', 'droll', 'random' ].forEach(( type ) => {
      it( type, ( done ) => {
        const body = message.getMessageBody( type, 'me', '2 3 4' );
        should.exist( body );
        should.exist( body.resp );
        should.exist( body.options );
        JSON.stringify( body.options ).should.be.equal( '{"parse_mode":"Markdown"}' );
        done();
      });
    });
  });
});

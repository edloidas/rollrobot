const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.start.regexp', () => {
  const regexp = message.type.start.regexp;
  let msg = 'should be valid for `/start` followed by nothing or whitespace and anything after.';
  describe( msg, () => {
    const commands = [
      '/start', '/start   ', '/start 2',
      '/start   df 2', '/start xxx ',
      '/start@rollrobot  1 ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 2 );
      match[ 1 ].should.be.equal( '/start' );
      done();
    }));
  });

  msg = 'should be valid when begins with `/start` and whitespaces or nothing right after.';
  describe( msg, () => {
    const commands = [
      'start', ' /start', '/start2', '/startqw',
      '/Start', '/START', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

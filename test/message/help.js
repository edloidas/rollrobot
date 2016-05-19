const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.help.regexp', () => {
  const regexp = message.type.help.regexp;
  let msg = 'should be valid for `/help` followed by nothing or whitespace and anything after.';
  describe( msg, () => {
    const commands = [
      '/help', '/help   ', '/help 2',
      '/help   df 2', '/help xxx ',
      '/help@rollrobot  1 ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 2 );
      match[ 1 ].should.be.equal( '/help' );
      done();
    }));
  });

  msg = 'should be valid when begins with `/help` and whitespaces or nothing right after.';
  describe( msg, () => {
    const commands = [
      'help', ' /help', '/help2', '/helpqw',
      '/Help', '/HELP', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

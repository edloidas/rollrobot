const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.help.regexp', () => {
  const regexp = message.type.help.regexp;
  let msg = 'should be parsed as default command';
  describe( msg, () => {
    const commands = [
      '/help', '/help   ', '/help 2',
      '/help   df 2 ', '/help@rollrobot  1 ',
    ];

    commands.forEach( cmd => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 2 );
      match[ 1 ].should.be.equal( '/help' );
      done();
    }));
  });

  msg = 'should be not be recognized as command';
  describe( msg, () => {
    const commands = [
      'help', ' /help', '/help2', '/helpqw',
      '/Help', '/HELP', ' 123',
    ];

    commands.forEach( cmd => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

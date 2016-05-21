const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.random.regexp', () => {
  const regexp = message.type.random.regexp;
  let msg = 'should be parsed as default command';
  describe( msg, () => {
    const commands = [
      '/random', '/random   ', '/random 2g',
      '/random   mn3 ', '/random@rollrobot q ',
      '/random -5 ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/random' );
      should.not.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be parsed as command with 1 argument';
  describe( msg, () => {
    const commands = [
      '/random 2', '/random  4  sd',
      '/random@rollrobot  1  g ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/random' );
      should.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be not be recognized as command';
  describe( msg, () => {
    const commands = [
      'random', ' /random', '/random2', '/randomqw',
      '/Random', '/RANDOM', ' 123',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

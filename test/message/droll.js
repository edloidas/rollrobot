const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.type.droll.regexp', () => {
  const regexp = message.type.droll.regexp;
  let msg = 'should be parsed as default command';
  describe( msg, () => {
    const commands = [
      '/droll', '/droll   ', '/droll 2g',
      '/droll   mn3 ', '/droll@rollrobot q ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/droll' );
      should.not.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be parsed as command with 1 argument';
  describe( msg, () => {
    const commands = [
      '/droll 2', '/droll  4  sd',
      '/droll -5 ', '/droll@rollrobot  1  g ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/droll' );
      should.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be not be recognized as command';
  describe( msg, () => {
    const commands = [
      'droll', ' /droll', '/droll2', '/drollqw',
      '/Droll', '/DROLL', ' 123',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

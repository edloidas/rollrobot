const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.sroll.regexp', () => {
  const regexp = message.type.sroll.regexp;
  let msg = 'should be parsed as default command';
  describe( msg, () => {
    const commands = [
      '/sroll', '/sroll   ', '/sroll 2g',
      '/sroll   mn3 ', '/sroll@rollrobot q ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/sroll' );
      should.not.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be parsed as command with 1 argument';
  describe( msg, () => {
    const commands = [
      '/sroll 2', '/sroll  4  sd',
      '/sroll -5 ', '/sroll@rollrobot  1  g ',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/sroll' );
      should.exist( match[ 2 ]);
      done();
    }));
  });

  msg = 'should be not be recognized as command';
  describe( msg, () => {
    const commands = [
      'sroll', ' /sroll', '/sroll2', '/srollqw',
      '/Sroll', '/SROLL', ' 123',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

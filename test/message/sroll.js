const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.sroll.regexp', () => {
  const regexp = message.type.sroll.regexp;
  let msg = 'should be valid for `/sroll` followed by non or any char but whitespaces with digit.';
  describe( msg, () => {
    const commands = [
      '/sroll', '/sroll   ', '/sroll 2g',
      '/sroll   mn3', '/sroll  fghj  ',
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

  msg = 'should be valid for `/sroll` followed by whitespaces with digit and anything after.';
  describe( msg, () => {
    const commands = [
      '/sroll 2', '/sroll   3',
      '/sroll  4  ', '/sroll  4  sdfds',
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

  msg = 'should be valid when begins with `/sroll` and whitespaces or nothing right after.';
  describe( msg, () => {
    const commands = [
      'sroll', ' /sroll', '/sroll2', '/srollqw',
      '/Sroll', '/SROLL', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

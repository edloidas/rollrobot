const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.droll.regexp', () => {
  const regexp = message.droll.regexp;
  let msg = 'should be valid for `/droll` followed by non or any char but whitespaces with digit';
  it( msg, ( done ) => {
    const commands = [
      '/droll', '/droll   ', '/droll 2g',
      '/droll   mn3', '/droll  fghj  ',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/droll' );
      should.not.exist( match[ 2 ]);
    });

    done();
  });

  msg = 'should be valid for `/droll` followed by whitespaces with digit and anything after';
  it( msg, ( done ) => {
    const commands = [
      '/droll 2', '/droll   3',
      '/droll  4  ', '/droll  4  sdfds',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/droll' );
      should.exist( match[ 2 ]);
    });

    done();
  });

  msg = 'should be valid when begins with `/droll` and whitespaces or nothing right after';
  it( msg, ( done ) => {
    const commands = [
      'droll', ' /droll', '/droll2', '/drollqw',
      '/Droll', '/DROLL', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
    });

    done();
  });
});

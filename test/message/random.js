const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.random.regexp', () => {
  const regexp = message.random.regexp;
  let msg = 'should be valid for `/random` followed by non or any char but whitespaces with digit';
  it( msg, ( done ) => {
    const commands = [
      '/random', '/random   ', '/random 2g',
      '/random   mn3', '/random  fghj  ',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/random' );
      should.not.exist( match[ 2 ]);
    });

    done();
  });

  msg = 'should be valid for `/random` followed by whitespaces with digit and anything after';
  it( msg, ( done ) => {
    const commands = [
      '/random 2', '/random   3',
      '/random  4  ', '/random  4  sdfds',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/random' );
      should.exist( match[ 2 ]);
    });

    done();
  });

  msg = 'should be valid when begins with `/random` and whitespaces or nothing right after';
  it( msg, ( done ) => {
    const commands = [
      'random', ' /random', '/random2', '/randomqw',
      '/Random', '/RANDOM', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
    });

    done();
  });
});

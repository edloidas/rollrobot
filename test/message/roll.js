const should = require( 'should' );
const compact = require( 'lodash' ).compact;
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.roll.regexp', () => {
  const regexp = message.type.roll.regexp;
  let msg = 'should be valid for `/roll` followed by non or any char but whitespaces with digit';
  it( msg, ( done ) => {
    const commands = [
      '/roll', '/roll   ', '/roll 2g',
      '/roll   mn3', '/roll  fghj  ',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/roll' );
      should.exist( match[ 2 ]);
      match[ 2 ].should.be.equal( '' );
    });

    done();
  });

  msg = 'should be valid for `/roll` followed by whitespaces with digit and anything after';
  it( msg, ( done ) => {
    const commands = [
      '/roll 2', '/roll   3',
      '/roll  4  ', '/roll  4  sdfds',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/roll' );
      should.exist( match[ 2 ]);
    });

    done();
  });

  msg = 'should be valid for `/roll` with 0..3 number of paremeters';
  it( msg, ( done ) => {
    function paramCheck( count, cmd ) {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/roll' );
      should.exist( match[ 2 ]);

      const params = compact( match[ 2 ].split( ' ' ));
      params.length.should.be.equal( count );
    }

    let commands = [
      '/roll 2', '/roll   3', '/roll   3 4_',
      '/roll  4  ', '/roll  4  sdfds',
    ];
    commands.forEach( paramCheck.bind( null, 1 ));

    commands = [
      '/roll 2 3', '/roll   3 4', '/roll   3 4 5_',
      '/roll  4  5 ', '/roll  4  5  sdfds',
    ];
    commands.forEach( paramCheck.bind( null, 2 ));

    commands = [
      '/roll 2 3 4', '/roll   3 4 5', '/roll   3 4 5 6_',
      '/roll  4  5 6 ', '/roll  4  5  6 sdfds', '/roll 4 5 6 7',
    ];
    commands.forEach( paramCheck.bind( null, 3 ));

    done();
  });

  msg = 'should be valid when begins with `/roll` and whitespaces or nothing right after';
  it( msg, ( done ) => {
    const commands = [
      'roll', ' /roll', '/roll2', '/rollqw',
      '/Roll', '/ROLL', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
    });

    done();
  });
});

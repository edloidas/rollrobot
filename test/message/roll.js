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
  let msg = 'should be valid for `/roll` followed by non or any char but whitespaces with digit.';
  describe( msg, () => {
    const commands = [
      '/roll', '/roll   ', '/roll 2g',
      '/roll   mn3', '/roll  fghj  ',
      '/roll@rollrobot q ', '/roll -1',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/roll' );
      should.exist( match[ 2 ]);
      match[ 2 ].should.be.equal( '' );
      done();
    }));
  });

  msg = 'should be valid for `/roll` with 0..3 number of paremeters.';
  describe( msg, () => {
    function paramCheck( count, cmd ) {
      it( `[ '${ cmd }' ]`, ( done ) => {
        const match = cmd.match( regexp );
        should.exist( match );
        match.length.should.be.equal( 3 );
        match[ 1 ].should.be.equal( '/roll' );
        should.exist( match[ 2 ]);

        const params = compact( match[ 2 ].split( ' ' ));
        params.length.should.be.equal( count );
        done();
      });
    }

    let commands = [
      '/roll 2', '/roll   3', '/roll   3 4_',
      '/roll  4  ', '/roll  4  sdfds',
      '/roll@rollrobot  1  g ', '/roll 5 -1',
    ];
    commands.forEach( paramCheck.bind( this, 1 ));

    commands = [
      '/roll 2 3', '/roll   3 4', '/roll   3 4 5_',
      '/roll  4  5 ', '/roll  4  5  sdfds',
      '/roll@rollrobot  1  5  1g ',
    ];
    commands.forEach( paramCheck.bind( this, 2 ));

    commands = [
      '/roll 2 3 4', '/roll   3 4 5', '/roll   3 4 5 6_',
      '/roll  4  5 6 ', '/roll  4  5  6 sdfds', '/roll 4 5 6 7',
      '/roll@rollrobot  1  5  4  1g ', '/roll 2 4 -5 -5',
    ];
    commands.forEach( paramCheck.bind( this, 3 ));
  });

  msg = 'should be valid when begins with `/roll` and whitespaces or nothing right after.';
  describe( msg, () => {
    const commands = [
      'roll', ' /roll', '/roll2', '/rollqw',
      '/Roll', '/ROLL', ' 123', ' asdf',
    ];

    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

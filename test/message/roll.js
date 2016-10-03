const should = require( 'should' );
const compact = require( 'lodash' ).compact;
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.roll.regexp', () => {
  const regexp = message.type.roll.regexp;
  let msg = 'should be parsed as default command';
  describe( msg, () => {
    const commands = [
      '/roll', '/roll   ', '/roll 2g',
      '/roll   mn3 ', '/roll -1',
      '/roll@rollrobot q ',
    ];

    commands.forEach( cmd => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.exist( match );
      match.length.should.be.equal( 3 );
      match[ 1 ].should.be.equal( '/roll' );
      should.exist( match[ 2 ]);
      match[ 2 ].should.be.equal( '' );
      done();
    }));
  });

  msg = 'should be parsed as command with 1..3 argument';
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
      '/roll 2', '/roll   3 ', '/roll   3 4_',
      '/roll  4  sd', '/roll 5 -1',
      '/roll@rollrobot  1  g ',
    ];
    commands.forEach( paramCheck.bind( this, 1 ));

    commands = [
      '/roll 2 3', '/roll   3 4 5_',
      '/roll  4  5  sd',
      '/roll@rollrobot  1  5  1g ',
    ];
    commands.forEach( paramCheck.bind( this, 2 ));

    commands = [
      '/roll 2 3 4', '/roll   3 4 5 6_',
      '/roll  4  5  6 sd', '/roll 4 5 6 7',
      '/roll 2 4 -5 -5', '/roll@rollrobot  1  5  4  1g ',
    ];
    commands.forEach( paramCheck.bind( this, 3 ));
  });

  msg = 'should be not be recognized as command';
  describe( msg, () => {
    const commands = [
      'roll', ' /roll', '/roll2', '/rollqw',
      '/Roll', '/ROLL', ' 123',
    ];

    commands.forEach( cmd => it( `[ '${ cmd }' ]`, ( done ) => {
      const match = cmd.match( regexp );
      should.not.exist( match );
      done();
    }));
  });
});

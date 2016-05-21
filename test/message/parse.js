const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.matchAndParse()', () => {
  const matchAndParse = message.matchAndParse.bind( message );

  function runCommands( commands, type, equal ) {
    commands.forEach(( cmd ) => it( `[ '${ cmd }' ]`, ( done ) => {
      const values = matchAndParse( cmd, type );
      should.exist( values );
      values.length.should.be.equal( equal );
      done();
    }));
  }

  // /start
  let type = 'start';

  let msg = 'should be parsed without exceptions `/start`';
  describe( msg, () => {
    const commands = [
      '/start', '/start q', '/start 1q',
      '/start 1', '/start  1 ',
      '/start@rollrobot  1 ',
    ];

    runCommands( commands, type, 0 );
  });

  // /help
  type = 'help';

  msg = 'should be parsed without exceptions `/help`';
  describe( msg, () => {
    const commands = [
      '/help', '/help q', '/help 1q',
      '/help 1', '/help  1 ',
      '/help@rollrobot  1 ',
    ];

    runCommands( commands, type, 0 );
  });

  // /roll
  type = 'roll';

  msg = 'should be parsed without exceptions `/roll`';
  describe( msg, () => {
    const commands = [
      '/roll', '/roll q', '/roll 1q',
      '/roll@rollrobot  q ',
    ];

    runCommands( commands, type, 0 );
  });

  msg = 'should be parsed without exceptions `/roll x`';
  describe( msg, () => {
    const commands = [
      '/roll 1', '/roll   2', '/roll   3   ',
      '/roll 999999999999999999999999999999',
      '/roll 9 2q', '/roll@rollrobot  1  q ',
    ];

    runCommands( commands, type, 1 );
  });

  msg = 'should be parsed without exceptions `/roll x y`';
  describe( msg, () => {
    const commands = [
      '/roll 1 2', '/roll   2  3', '/roll   3  4 ',
      '/roll 1 999999999999999999999999999999',
      '/roll 999999999999999999999999999999 999999999999999999999999999999',
      '/roll 1 2 3a', '/roll@rollrobot  1  2  q ',
    ];

    runCommands( commands, type, 2 );
  });

  msg = 'should be parsed without exceptions `/roll x y z`';
  describe( msg, () => {
    const commands = [
      '/roll 1 2 3', '/roll   2  3  4', '/roll   3  4  5 ',
      '/roll 1 2 999999999999999999999999999999',
      '/roll 1 999999999999999999999999999999 999999999999999999999999999999',
      '/roll 1 2 3 4', '/roll 1 2 3 4a', '/roll@rollrobot  1  2  3  q ',
    ];

    runCommands( commands, type, 3 );
  });

  // /sroll
  type = 'sroll';

  msg = 'should be parsed without exceptions `/sroll`';
  describe( msg, () => {
    const commands = [
      '/sroll', '/sroll q', '/sroll 1q',
      '/sroll@rollrobot  q ',
    ];

    runCommands( commands, type, 0 );
  });

  msg = 'should be parsed without exceptions `/sroll x`';
  describe( msg, () => {
    const commands = [
      '/sroll 1', '/sroll   2', '/sroll   3   ',
      '/sroll 999999999999999999999999999999',
      '/sroll 9 2q', '/sroll 9 2',
      '/sroll@rollrobot  1  q ',
    ];

    runCommands( commands, type, 1 );
  });

  // /droll
  type = 'droll';

  msg = 'should be parsed without exceptions `/droll`';
  describe( msg, () => {
    const commands = [
      '/droll', '/droll q', '/droll 1q',
      '/droll@rollrobot  q ',
    ];

    runCommands( commands, type, 0 );
  });

  msg = 'should be parsed without exceptions `/droll x`';
  describe( msg, () => {
    const commands = [
      '/droll 1', '/droll   2', '/droll   3   ',
      '/droll 999999999999999999999999999999',
      '/droll 9 2q', '/droll 9 2',
      '/droll@rollrobot  1  q ',
    ];

    runCommands( commands, type, 1 );
  });

  // /random
  type = 'random';

  msg = 'should be parsed without exceptions `/random`';
  describe( msg, () => {
    const commands = [
      '/random', '/random q', '/random 1q',
      '/random@rollrobot  q ',
    ];

    runCommands( commands, type, 0 );
  });

  msg = 'should be parsed without exceptions `/random x`';
  describe( msg, () => {
    const commands = [
      '/random 1', '/random   2', '/random   3   ',
      '/random 999999999999999999999999999999',
      '/random 9 2q', '/random 9 2',
      '/random@rollrobot  1  q ',
    ];

    runCommands( commands, type, 1 );
  });

  // inline
  type = 'inline';

  msg = 'should be parsed without exceptions inline command';
  describe( msg, () => {
    const commands = [
      '1 1 1', '-2 2 2 ', '3 3 -3 ',
      '  -4  4  -4  ',
    ];

    runCommands( commands, type, 3 );
  });
});

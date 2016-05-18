const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.getMessageBody', () => {
  function checkBody( type, msg, values, reply ) {
    const body = message.getMessageBody( type, msg, values, reply );
    should.exist( body );
    should.exist( body.resp );
    should.exist( body.options );

    return body;
  }

  const messageFull = {
    message_id: '1234567890abcdef',
    from: {
      first_name: 'Firstname',
      last_name: 'Lastname',
      username: 'userUsername',
    },
    chat: {
      username: 'chatUsername',
    },
  };

  const messageChannel = {
    message_id: '1234567890abcdef',
    chat: {
      username: 'chatUsername',
      type: 'channel',
    },
  };

  let msg = 'should generate valid response';
  describe( msg, () => {
    it( 'Full message', ( done ) => {
      const body = checkBody( 'roll', messageFull, '2 3 4' );
      body.resp.should.be.startWith( '_Firstname Lastname _@userUsername `(2d3+4)` *' );
      done();
    });

    it( 'Full message, reply', ( done ) => {
      const body = checkBody( 'roll', messageFull, '2 3 4', true );
      body.resp.should.be.startWith( '`(2d3+4)` *' );
      done();
    });

    it( 'Channel message, without user', ( done ) => {
      const body = checkBody( 'roll', messageChannel, '2 3 4', false );
      body.resp.should.be.startWith( '`(2d3+4)` *' );
      done();
    });
  });

  msg = 'should generate valid response options (reply)';
  describe( msg, () => {
    [ 'roll', 'sroll', 'droll', 'random' ].forEach(( type ) => {
      it( type, ( done ) => {
        const body = checkBody( type, messageFull, '2 3 4', true );
        const optionsString = '{"parse_mode":"Markdown"}';
        JSON.stringify( body.options ).should.be.equal( optionsString );
        done();
      });
    });
  });

  msg = 'should generate valid response options (reply, channel)';
  describe( msg, () => {
    it( 'roll', ( done ) => {
      const body = checkBody( 'roll', messageChannel, '2 3 4', true );
      const optionsString = '{"parse_mode":"Markdown","reply_to_message_id":"1234567890abcdef"}';
      JSON.stringify( body.options ).should.be.equal( optionsString );
      done();
    });
  });
});

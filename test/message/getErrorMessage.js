const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.getErrorMessage', () => {
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
    },
  };

  const msg = 'should generate valid error response';
  describe( msg, () => {
    it( 'Full message', ( done ) => {
      const error = message.getErrorMessage( messageFull );
      error.should.be.equal( '@userUsername : `(Request encountered an error.)`' );
      done();
    });

    it( 'Channel message', ( done ) => {
      const error = message.getErrorMessage( messageChannel );
      error.should.be.equal( '@chatUsername : `(Request encountered an error.)`' );
      done();
    });
  });
});

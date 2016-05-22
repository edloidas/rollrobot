const should = require( 'should' );
const sinon = require( 'sinon' );
const errorHandler = require( '../../src/error/errorHandler' );
require( 'should-sinon' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'ErrorHandler', () => {
  const error = new Error( 'Some error message' );

  it( 'should render', ( done ) => {
    const renderedError = errorHandler.render( error );
    should.exist( renderedError );
    renderedError.should.not.be.equal( error.toString());
    done();
  });

  it( 'should start without styles', ( done ) => {
    const spy = sinon.spy( errorHandler, 'applyStyles' );
    errorHandler.start();
    errorHandler.stop();
    spy.should.not.be.called();
    errorHandler.applyStyles.restore();
    done();
  });

  it( 'should apply styles on start, if present', ( done ) => {
    const spy = sinon.spy( errorHandler, 'applyStyles' );
    errorHandler.setStyles();
    errorHandler.start();
    errorHandler.stop();
    spy.should.be.calledOnce();
    errorHandler.applyStyles.restore();
    done();
  });

  it( 'should reset styles', ( done ) => {
    const spy = sinon.spy( errorHandler, 'applyStyles' );
    errorHandler.setStyles();
    errorHandler.start().stop();
    errorHandler.resetStyles();
    errorHandler.start().stop();
    spy.should.be.calledOnce();
    errorHandler.applyStyles.restore();
    done();
  });
});

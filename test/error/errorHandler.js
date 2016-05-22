const should = require( 'should' );
const sinon = require( 'sinon' );
const errorHandler = require( '../../src/error/errorHandler' );
const defaultStyles = require( '../../src/error/errorHandlerStyles' );
require( 'should-sinon' );

const errorHandlerStyles = errorHandler.styles;

// Same global instance of ErrorHandler is used
// Reset ErrorHandler before use...
before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  errorHandler.resetStyles();
  done();
});

// ... and restore it afterwards.
after(( done ) => {
  errorHandler.setStyles( errorHandlerStyles ).applyStyles();
  errorHandler.stop().start();
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
    // errorHandler.resetStyles();
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
    const applyStyles = sinon.spy( errorHandler, 'applyStyles' );
    errorHandler.setStyles();
    errorHandler.start().stop();
    errorHandler.resetStyles();
    errorHandler.start().stop();
    applyStyles.should.be.calledOnce();
    errorHandler.applyStyles.restore();
    done();
  });

  it( 'should apply default styles, if none present', ( done ) => {
    const appendStyle = sinon.spy( errorHandler.pe, 'appendStyle' );
    errorHandler.resetStyles();
    errorHandler.applyStyles();
    appendStyle.should.be.calledWith( defaultStyles );
    appendStyle.restore();
    done();
  });
});

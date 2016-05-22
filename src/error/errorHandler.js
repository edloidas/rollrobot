const PrettyError = require( 'pretty-error' );
const defaultStyles = require( './errorHandlerStyles' );

function ErrorHandler() {
  this.pe = new PrettyError();
  Object.defineProperty( this, 'pe', {
    writable: false,
  });

  this.styles = null;
}

ErrorHandler.prototype.render = function render( error ) {
  return this.pe.render( error );
};

ErrorHandler.prototype.start = function start() {
  this.pe.start();

  if ( this.styles ) {
    this.applyStyles();
  }
  return this;
};

ErrorHandler.prototype.stop = function stop() {
  this.pe.stop();
  return this;
};

ErrorHandler.prototype.setStyles = function setStyles( styles ) {
  this.styles = styles || defaultStyles;
  return this;
};

ErrorHandler.prototype.applyStyles = function applyStyles() {
  this.pe.appendStyle( this.styles || defaultStyles );
  return this;
};

ErrorHandler.prototype.resetStyles = function resetStyles() {
  this.styles = null;
  return this;
};

module.exports = new ErrorHandler();

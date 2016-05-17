const errorHandlerStyles = {
  'pretty-error > header > title > kind': {
  },
  'pretty-error > header > colon': {
  },
  'pretty-error > header > message': {
    color: 'red',
  },

  // each trace item ...
  'pretty-error > trace > item': {
    marginLeft: 2,
    bullet: '"•"',
  },
  'pretty-error > trace > item > header > pointer > file': {
    color: 'bright-cyan',
  },
  'pretty-error > trace > item > header > pointer > colon': {
    color: 'cyan',
  },
  'pretty-error > trace > item > header > pointer > line': {
    color: 'bright-cyan',
  },
  'pretty-error > trace > item > header > what': {
    color: 'bright-white',
  },
  'pretty-error > trace > item > footer > addr': {
  },
};

module.exports = errorHandlerStyles;

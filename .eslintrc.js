module.exports = {
  'extends': 'airbnb-base',
  'rules': {
    'block-spacing': [ 2, 'always' ],
    'space-before-function-paren': [ 2, { 'anonymous': 'always', 'named': 'never' } ],
    'space-in-parens': [ 2, 'always', { 'exceptions': [ '{}', '[]', '()' ] } ],
    'spaced-comment': [ 2, 'always', { 'exceptions': [ '-', '+' ] } ],
    'arrow-spacing': [ 2, { 'before': true, 'after': true } ],
    'array-bracket-spacing': [ 2, 'always' ],
    'computed-property-spacing': [ 2, 'always' ],
    'template-curly-spacing': [ 2, 'always' ],
    'no-restricted-syntax': [ 'off' ],
    'object-property-newline': [ 'off', { 'allowMultiplePropertiesPerLine': true } ],
    'no-plusplus': [ 'error', { 'allowForLoopAfterthoughts': true } ]
  },
  'env': {
    'browser': true,
    'node': true,
    'jest': true
  }
}

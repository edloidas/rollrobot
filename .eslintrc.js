module.exports = {
  'extends': [
    'airbnb-base',
    'prettier',
  ],
  'plugins': [
    'prettier',
  ],
  'rules': {
    'spaced-comment': [ 2, 'always', { 'exceptions': [ '-', '+' ] } ],
    'no-restricted-syntax': [ 'off' ],
    'object-property-newline': [ 'off', { 'allowMultiplePropertiesPerLine': true } ],
    'no-underscore-dangle': [ 'off' ],
    'comma-dangle': [ 'error', {
        'arrays': 'never',
        'objects': 'never',
        'imports': 'never',
        'exports': 'never',
        'functions': 'ignore',
    }],
    'import/no-extraneous-dependencies': [ 'off', { 'devDependencies': [ 'util/', '**/*.test.js', '**/*.spec.js' ] } ],
    'prettier/prettier': ['error', {
      'singleQuote': true,
    }],
    // 'quotes': ['error', 'single'],
    // no support in 'babel-eslint'; should be 'error'
    'no-await-in-loop': [ 'off' ],
  },
  'env': {
    'node': true,
    'jest': true
  }
}

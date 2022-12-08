module.exports = {
  'extends': [
    'airbnb-base',
  ],
  'rules': {
    'spaced-comment': [ 2, 'always', { 'exceptions': [ '-', '+' ] } ],
    'no-restricted-syntax': [ 'off' ],
    'object-curly-spacing': [ 'off' ],
    'arrow-parens': ['error', 'as-needed'],
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
    'no-console': [ 'warn', { allow: [ 'error' ] } ],
    // 'quotes': ['error', 'single'],
    // no support in 'babel-eslint'; should be 'error'
    'no-await-in-loop': [ 'off' ],
    'import/prefer-default-export': [ 'off' ],
    'camelcase': [ 'off' ],
  },
  'env': {
    'node': true,
    'jest': true
  }
}

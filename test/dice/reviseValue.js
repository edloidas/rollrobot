const should = require( 'should' );
const dice = require( '../../src/dice' );
const { MAX_VALUE, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER } = Number;

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Dice.reviseValue', () => {
  const msg = 'should revise the values from parameter of any time in valid range';
  describe( msg, () => {
    const values = [
      { given: 1, expected: 1 },
      { given: -1, expected: 0 },
      { given: 99007199254740991, expected: MAX_SAFE_INTEGER },
      { given: MAX_VALUE, expected: 1 },
      { given: -Infinity, expected: 0 },
      { given: Infinity, expected: 0 },
      { given: '2', expected: 2 },
      { given: ' 3 ', expected: 3 },
      { given: 'q', expected: 0 },
      { given: 'fff', expected: 0 },
      { given: -1, expected: -1, min: -10 },
      { given: -99, expected: -99, min: MIN_SAFE_INTEGER },
      { given: -99007199254740991, expected: MIN_SAFE_INTEGER, min: MIN_SAFE_INTEGER },
    ];

    values.forEach(( value ) => it( `${ value.given } → '${ value.expected }'`, ( done ) => {
      dice.reviseValue( value.given, value.max, value.min ).should.be.equal( value.expected );
      done();
    }));
  });
});

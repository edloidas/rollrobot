const should = require( 'should' );
const dice = require( '../../src/dice' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'dice.reviseValue', () => {
  const msg = 'should revise the values from parameter of any time in valid range.';
  describe( msg, () => {
    const values = [
      { given: 1, expected: 1 },
      { given: -1, expected: 0 },
      { given: 99007199254740991, expected: Number.MAX_SAFE_INTEGER },
      { given: Number.MAX_VALUE, expected: 1 },
      { given: -Infinity, expected: 0 },
      { given: Infinity, expected: 0 },
      { given: '2', expected: 2 },
      { given: ' 3 ', expected: 3 },
      { given: 'q', expected: 0 },
      { given: 'fff', expected: 0 },
    ];

    values.forEach(( value ) => it( `${ value.given } → '${ value.expected }'`, ( done ) => {
      dice.reviseValue( value.given ).should.be.equal( value.expected );
      done();
    }));
  });
});

const should = require( 'should' );
const dice = require( '../../src/dice' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Dice.roll', () => {
  const msg = 'should roll the values in safe range';
  describe( msg, () => {
    const values = [
      { given: [], below: 26, view: '2d10+0' },
      { given: [ 3 ], below: 31, view: '3d10+0' },
      { given: [ 4, 100 ], below: 401, view: '4d100+0' },
      { given: [ 5, 1000, 999 ], below: 6000, view: '5d1000+999' },
      { given: [ 1, 3, 2, 5, 7 ], below: 12, view: '1d3+2' },
      { given: [ -1, -1, 0 ], below: 2, view: '1d1+0' },
      { given: [ -1, -1, -1 ], below: 1, view: '1d1-1' },
      { given: [ 'q', Number.MAX_VALUE, Infinity ], below: 2, view: '1d1+0' },
      { given: [ 10, 1, 1 ], below: 12, view: '10d1+1' },
      { given: [ 900000, 1, 1 ], below: 14, view: '12d1+1' },
      { given: [ 4, 5, -20 ], above: -1, below: 1, view: '4d5-20' },
      { given: [ 4, 5, -999 ], above: -1, below: 1, view: '4d5-999' },
    ];

    values.forEach( value => it( `[ ${ value.given } ] <= '${ value.below }'`, ( done ) => {
      const rollResult = dice.roll( ...value.given );
      should.exist( rollResult );
      if ( value.below ) {
        rollResult.result.should.be.below( value.below );
      }
      if ( value.above ) {
        rollResult.result.should.be.above( value.above );
      }
      rollResult.view.should.be.equal( value.view );
      done();
    }));
  });
});

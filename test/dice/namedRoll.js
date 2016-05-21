const should = require( 'should' );
const dice = require( '../../src/dice' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Dice.namedRoll', () => {
  let msg = 'should roll the values in safe range.';
  describe( msg, () => {
    const values = {
      sroll: [
        { given: [], below: 13, view: '2d6+0' },
        { given: [ 1 ], below: 14, view: '2d6+1' },
        { given: [ 1, 2 ], below: 14, view: '2d6+1' },
        { given: [ 'q' ], below: 13, view: '2d6+0' },
        { given: [ 'q', 1 ], below: 13, view: '2d6+0' },
        { given: [ -1 ], below: 12, view: '2d6-1' },
        { given: [ -100 ], below: 1, above: -1, view: '2d6-100' },
      ],
      droll: [
        { given: [], below: 41, view: '2d20+0' },
        { given: [ 1 ], below: 42, view: '2d20+1' },
        { given: [ 1, 2 ], below: 41, view: '2d20+1' },
        { given: [ 'q' ], below: 41, view: '2d20+0' },
        { given: [ 'q', 1 ], below: 41, view: '2d20+0' },
        { given: [ -1 ], below: 40, view: '2d20-1' },
        { given: [ -100 ], below: 1, above: -1, view: '2d20-100' },
      ],
      random: [
        { given: [], below: 101, view: '1d100+0' },
        { given: [ 1 ], below: 2, view: '1d1+0' },
        { given: [ 100 ], below: 101, view: '1d100+0' },
        { given: [ 1000 ], below: 1001, view: '1d1000+0' },
        { given: [ 10, 100 ], below: 11, view: '1d10+0' },
        { given: [ 'q' ], below: 2, view: '1d1+0' },
        { given: [ -10 ], below: 101, view: '1d1+0' },
      ],
    };

    for ( const type in values ) {
      if ({}.hasOwnProperty.call( values, type )) {
        msg = `'${ type }'`;
        describe( msg, () => {
          values[ type ].forEach(
            ( value ) => it( `[ ${ value.given } ] <= '${ value.below }'`, ( done ) => {
              const rollResult = dice.namedRoll( type, value.given );
              should.exist( rollResult );
              if ( value.below ) {
                rollResult.result.should.be.below( value.below );
              }
              if ( value.above ) {
                rollResult.result.should.be.above( value.above );
              }
              rollResult.view.should.be.equal( value.view );
              done();
            })
          );
        });
      }
    }
  });
});

const should = require( 'should' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'Message.getInlineArticles()', () => {
  const getInlineArticles = message.getInlineArticles.bind( message );
  describe( 'should generate valid number of articles', () => {
    const commands = [
      { query: '', count: 4 },
      { query: ' 1', count: 4 },
      { query: ' -1', count: 2 },
      { query: ' -1 2 3', count: 2 },
      { query: ' 1 2', count: 1 },
      { query: ' 1 2 -3', count: 1 },
      { query: '  1 2 3 ', count: 1 },
      { query: '  1 2 3 ', count: 1 },
    ];

    commands.forEach( cmd => it( `'${ cmd.query }' → ${ cmd.count }`, ( done ) => {
      const articles = getInlineArticles( cmd.query );
      should.exist( articles );
      articles.length.should.be.equal( cmd.count );
      done();
    }));
  });
});

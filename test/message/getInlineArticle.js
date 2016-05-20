const should = require( 'should' );
const deepAssign = require( 'deep-assign' );
const message = require( '../../src/message' );

before(( done ) => {
   // HACK: bypass ESLint no-unused-var error
  should.exist( should );
  done();
});

describe( 'message.getInlineArticle()', () => {
  const getInlineArticle = message.getInlineArticle.bind( message );
  describe( 'should generate valid article', () => {
    const commonArticle = {
      type: 'article',
      id: 123456789,
      title: 'RollType',
      input_message_content: {
        message_text: 'GeneratedNumber',
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      },
      hide_url: true,
      description: 'Description',
    };

    const commands = [
      { type: 'roll', values: [], article: { title: '/roll', description: '2d10+0' } },
      { type: 'sroll', values: [], article: { title: '/sroll', description: '2d6+0' } },
      { type: 'droll', values: [], article: { title: '/droll', description: '2d20+0' } },
      { type: 'random', values: [], article: { title: '/random', description: '1d100+0' } },

      { type: 'roll', values: [ -5 ] },
      { type: 'sroll', values: [ -5 ], article: { title: '/sroll', description: '2d6-5' } },
      { type: 'droll', values: [ -5 ], article: { title: '/droll', description: '2d20-5' } },
      { type: 'random', values: [ -5 ] },

      { type: 'roll', values: [ 8 ], article: { title: '/roll', description: '8d10+0' } },
      { type: 'sroll', values: [ 8 ], article: { title: '/sroll', description: '2d6+8' } },
      { type: 'droll', values: [ 8 ], article: { title: '/droll', description: '2d20+8' } },
      { type: 'random', values: [ 8 ], article: { title: '/random', description: '1d8+0' } },

      { type: 'roll', values: [ 8, -10 ], article: { title: '/roll', description: '8d1+0' } },
      { type: 'sroll', values: [ 8, -10 ], article: { title: '/sroll', description: '2d6+8' } },
      { type: 'droll', values: [ 8, -10 ], article: { title: '/droll', description: '2d20+8' } },
      { type: 'random', values: [ 8, -10 ], article: { title: '/random', description: '1d8+0' } },

      { type: 'roll', values: [ 8, 7 ], article: { title: '/roll', description: '8d7+0' } },
      { type: 'sroll', values: [ 8, 7 ], article: { title: '/sroll', description: '2d6+8' } },
      { type: 'droll', values: [ 8, 7 ], article: { title: '/droll', description: '2d20+8' } },
      { type: 'random', values: [ 8, 7 ], article: { title: '/random', description: '1d8+0' } },

      { type: 'roll', values: [ -8, -7 ] },
      { type: 'random', values: [ -8, -7 ] },

      { type: 'roll', values: [ 8, 7, 9 ], article: { title: '/roll', description: '8d7+9' } },
      { type: 'roll', values: [ 8, 7, -10 ], article: { title: '/roll', description: '8d7-10' } },
    ];

    commands.forEach(( cmd ) => it( `'/${ cmd.type }' ${ cmd.values }`, ( done ) => {
      const article = getInlineArticle( cmd.type, cmd.values );
      if ( !cmd.article ) {
        should.not.exist( article );
      } else {
        const testArticle = deepAssign( commonArticle, cmd.article );
        article.id = 123456789;
        article.input_message_content.message_text = 'GeneratedNumber';
        article.should.be.eql( testArticle );
      }
      done();
    }));
  });
});

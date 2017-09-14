const nanoid = require('nanoid');
const {
  parseAndRollSimple,
  parseSimpleRoll,
  parseClassicRoll,
  parseWodRoll,
  roll
} = require('roll-parser');
const { limit } = require('../limiter');
const { createFullResultMessage } = require('../text');

const createInputMessageContent = text => ({
  message_text: text,
  parse_mode: 'Markdown',
  disable_web_page_preview: true
});

const createArticle = (title, description, message) => ({
  type: 'article',
  id: nanoid(),
  title,
  input_message_content: createInputMessageContent(message),
  hide_url: true,
  description
});

function createRollArticle(notation) {
  const title = 'Classic';
  const result = roll(
    limit(parseClassicRoll(notation || 'd20') || parseSimpleRoll(notation))
  );
  const message = result && createFullResultMessage(result);
  return result && createArticle(title, result.notation, message);
}

function createWodArticle(notation) {
  const title = 'World of Darkness';
  const result = roll(limit(parseWodRoll(notation || 'd10')));
  const message = result && createFullResultMessage(result);
  return result && createArticle(title, result.notation, message);
}

function createRandomArticle() {
  const title = 'Random';
  const result = parseAndRollSimple('100');
  const message = result && createFullResultMessage(result);
  return result && createArticle(title, result.notation, message);
}

function createInlineArticles(query = '') {
  const notation = query.trim();
  const articles = [
    createRollArticle(notation),
    createWodArticle(notation),
    createRandomArticle()
  ];

  return articles.filter(article => !!article);
}

module.exports = {
  createInlineArticles
};

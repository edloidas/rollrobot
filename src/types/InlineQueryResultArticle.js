const random = require( '../random' );
const InputTextMessageContent = require( './InputTextMessageContent' );

function InlineQueryResultArticle( title, message ) {
  this.type = 'article';
  this.id = random.getRandomId();
  this.title = title;
  this.message = message;
  this.hide_url: true;
}

module.exports = InlineQueryResultArticle;

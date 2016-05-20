const random = require( '../random' );

function InlineQueryResultArticle( title, description, message ) {
  this.type = 'article';
  this.id = random.getRandomId();
  this.title = title;
  this.input_message_content = message;
  this.hide_url = true;
  this.description = description;
}

module.exports = InlineQueryResultArticle;

const TelegramTest = require('telegram-test');

class EnhancedTelegramTest extends TelegramTest {
  constructor(bot, messageId = 1000, updateId = 0) {
    super(bot, messageId, updateId);
    this.setChatOptions();

    // Creating stub for testing purposes
    // eslint-disable-next-line no-param-reassign
    bot.answerInlineQuery = (queryId, articles = [], options = {}) => {
      bot.emit('testInline', queryId, articles, options);
    };
  }

  setChatOptions(
    {
      id = 1,
      first_name = 'TestName', // eslint-disable-line camelcase
      username = 'testUserName',
      type = 'private'
    } = {}
  ) {
    this.chatOptions = {
      id,
      first_name,
      username,
      type
    };
  }

  makeMessage(messageText, messageOptions = {}) {
    const options = Object.assign({}, messageOptions, this.chatOptions);
    return super.makeMessage(messageText, options);
  }

  send(messageText) {
    const chatId = this.chatOptions.id;
    return this.sendUpdate(chatId, messageText)
      .then(data => data.text)
      .catch(error => error.message);
  }

  createInlineMessage(query) {
    this.messageId += 1;
    return {
      id: this.messageId,
      query
    };
  }

  sendInlineQuery(query = '') {
    const bot = this.bot;
    const self = this;

    return new Promise(resolve => {
      bot.on('testInline', function handler(inlineQueryId, results, options) {
        bot.removeListener('testInline', handler);
        resolve({ results, options });
      });
      bot.emit('inline_query', self.createInlineMessage(query));
    });
  }

  inline(query) {
    return this.sendInlineQuery(query)
      .then(data => data.results)
      .catch(error => error);
  }
}

module.exports = EnhancedTelegramTest;

const TelegramTest = require('telegram-test');

class EnhancedTelegramTest extends TelegramTest {
  constructor(bot, messageId = 1000, updateId = 0) {
    super(bot, messageId, updateId);
    this.setChatOptions();
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
}

module.exports = EnhancedTelegramTest;

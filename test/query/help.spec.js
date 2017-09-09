const TelegramTest = require('telegram-test');
const { regexp } = require('../../src/query/help');
const { help } = require('../../src/text');
const { createBot } = require('../utils');

const server = new TelegramTest(createBot());
const chat = 1;

describe('Help commands', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/start')).toBeTruthy();
    expect(regexp.exec('/help@rollrobot')).toBeTruthy();
    expect(regexp.exec('/help@rollrobot something')).toBeTruthy();
    expect(regexp.exec('/start@rollrobot 2d6 ')).toBeTruthy();
  });

  test('should reply with help text for `/start` command', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/start');
    expect(data.text).toEqual(help);
  });

  test('should reply with help text for `/help` command', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/help');
    expect(data.text).toEqual(help);
  });
});

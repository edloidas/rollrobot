const TelegramTest = require('telegram-test');
const { deprecated } = require('../../src/text');
const { createBot } = require('../utils');

const server = new TelegramTest(createBot());
const chat = 1;

describe('Deprecated commands', () => {
  test('should reply with notice for `/sroll` command', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/sroll');
    expect(data.text).toEqual(deprecated);
  });

  test('should reply with notice for `/droll` command', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/droll');
    expect(data.text).toEqual(deprecated);
  });
});

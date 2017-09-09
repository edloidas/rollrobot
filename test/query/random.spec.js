const TelegramTest = require('telegram-test');
const { regexp } = require('../../src/query/random');
const { createBot } = require('../utils');

const server = new TelegramTest(createBot());
const chat = 1;

describe('/random', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/random')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot something')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot 2d6 ')).toBeTruthy();
  });

  test('should reply on simple command `/random`', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/random');
    expect(data.text).toEqual(expect.stringMatching(/`\(d100\)` \*\d{1,3}\*/));
  });

  test('should reply on simple command `/random d100+1000`', async () => {
    expect.assertions(1);
    const data = await server.sendUpdate(chat, '/random@rollrobot');
    expect(data.text).toEqual(expect.stringMatching(/`\(d100\)` \*\d{1,3}\*/));
  });
});

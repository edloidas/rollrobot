const TelegramTest = require('telegram-test');
const { regexp } = require('../../src/query/full');
const { error } = require('../../src/text');
const { createBot } = require('../utils');

const server = new TelegramTest(createBot());
const chat = 1;

describe('/full', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/full')).toBeTruthy();
    expect(regexp.exec('/full@rollrobot')).toBeTruthy();
    expect(regexp.exec('/full d20')[3]).toEqual(' d20');
    expect(regexp.exec('/full@rollrobot 6')[3]).toEqual(' 6');
  });

  test('should notify of invalid input for `/full` command', async () => {
    expect.assertions(4);

    const send = msg => server.sendUpdate(chat, msg).then(data => data.text);

    await expect(send('/full')).resolves.toEqual(error);
    await expect(send('/full a')).resolves.toEqual(error);
    await expect(send('/full -7')).resolves.toEqual(error);
    await expect(send('/full 6d')).resolves.toEqual(error);
  });

  test('should parse and roll notation for `/full` command', async () => {
    expect.assertions(5);

    const send = msg => server.sendUpdate(chat, msg).then(data => data.text);
    const matchingRegexp = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    const matching = expect.stringMatching(matchingRegexp);

    await expect(send('/full 10')).resolves.toEqual(matching);
    await expect(send('/full d20')).resolves.toEqual(matching);
    await expect(send('/full d8!')).resolves.toEqual(matching);
    await expect(send('/full 4d20-1')).resolves.toEqual(matching);
    await expect(send('/full 3d10!>6f3')).resolves.toEqual(matching);
  });
});

const { regexp } = require('../../src/query/help');
const { help } = require('../../src/text');
const { createTestServer } = require('../utils');

const server = createTestServer();

describe('Help commands', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/start')).toBeTruthy();
    expect(regexp.exec('/help@rollrobot')).toBeTruthy();
    expect(regexp.exec('/help@rollrobot something')).toBeTruthy();
    expect(regexp.exec('/start@rollrobot 2d6 ')).toBeTruthy();
  });

  test('should reply with help text for `/start` command', async () => {
    expect.assertions(1);
    await expect(server.send('/start')).resolves.toEqual(help);
  });

  test('should reply with help text for `/help` command', async () => {
    expect.assertions(1);
    await expect(server.send('/help')).resolves.toEqual(help);
  });
});

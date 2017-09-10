const { regexp } = require('../../src/query/random');
const { createTestServer } = require('../utils');

const server = createTestServer();

describe('/random', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/random')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot something')).toBeTruthy();
    expect(regexp.exec('/random@rollrobot 2d6 ')).toBeTruthy();
  });

  test('should reply on simple `/random` command', async () => {
    expect.assertions(2);
    const matching = expect.stringMatching(/`\(d100\)` \*\d{1,3}\*/);
    await expect(server.send('/random')).resolves.toEqual(matching);
    await expect(server.send('/random@rollrobot')).resolves.toEqual(matching);
  });

  test('should reply on `/random d100+1000` command', async () => {
    expect.assertions(1);
    const matching = expect.stringMatching(/`\(d100\)` \*\d{1,3}\*/);
    await expect(server.send('/random d100+1000')).resolves.toEqual(matching);
  });
});

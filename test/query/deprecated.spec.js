const { deprecated } = require('../../src/text');
const { createTestServer } = require('../utils');

const server = createTestServer();

describe('Deprecated commands', () => {
  test('should reply with notice for `/sroll` command', async () => {
    expect.assertions(1);
    await expect(server.send('/sroll')).resolves.toEqual(deprecated);
  });

  test('should reply with notice for `/droll` command', async () => {
    expect.assertions(1);
    await expect(server.send('/droll')).resolves.toEqual(deprecated);
  });
});

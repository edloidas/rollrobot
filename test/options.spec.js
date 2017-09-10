const { createTestServer } = require('./utils');

const server = createTestServer();

describe('Message options', () => {
  test('should have reply id, if created in group-like chat', async () => {
    expect.assertions(3);

    const send = msg =>
      server
        .sendUpdate(1, msg)
        .then(data => data)
        .catch(error => error);
    const propPath = 'form.reply_to_message_id';

    server.setChatOptions({ type: 'group' });
    await expect(send('/roll d20')).resolves.toHaveProperty(propPath);

    server.setChatOptions({ type: 'supergroup' });
    await expect(send('/roll d20')).resolves.toHaveProperty(propPath);

    server.setChatOptions({ type: 'channel' });
    await expect(send('/roll d20')).resolves.toHaveProperty(propPath);
  });
});

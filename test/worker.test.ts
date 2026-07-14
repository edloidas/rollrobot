import { describe, expect, test } from 'bun:test';
import worker, { type Env } from '../src/worker';

const env: Env = {
  TOKEN: '0123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
  WEBHOOK_SECRET: 'test-webhook-secret',
};

describe('Cloudflare Worker', () => {
  test('responds to health checks', async () => {
    const response = await worker.fetch(new Request('https://example.com/health'), env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  test('rejects unknown routes', async () => {
    const response = await worker.fetch(new Request('https://example.com/unknown'), env);

    expect(response.status).toBe(404);
  });

  test('rejects non-POST webhook requests', async () => {
    const response = await worker.fetch(new Request('https://example.com/webhook'), env);

    expect(response.status).toBe(404);
  });

  test('rejects webhook requests without the Telegram secret', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ update_id: 1 }),
      }),
      env,
    );

    expect(response.status).toBe(401);
  });
});

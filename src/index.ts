import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { config } from './config';

const { token, webhookUrl, port } = config;

if (!token) {
  console.error('TOKEN environment variable is required');
  process.exit(1);
}

const bot = createBot(token);

if (webhookUrl) {
  await bot.api.setWebhook(webhookUrl);
  console.log(`Webhook set to: ${webhookUrl}`);
}

const handleUpdate = webhookCallback(bot, 'bun');

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'POST') {
      return handleUpdate(req);
    }
    if (url.pathname === '/health') {
      return new Response('OK');
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Bot server running on port ${port}`);

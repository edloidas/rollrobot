import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { config } from './config';

const { token, webhookUrl, port } = config;

if (!token) {
  console.error('TOKEN environment variable is required');
  process.exit(1);
}

const bot = createBot(token);
const webhookPath = `/bot${token}`;

if (webhookUrl) {
  await bot.api.setWebhook(`${webhookUrl}${webhookPath}`);
  console.log(`Webhook set to: ${webhookUrl}${webhookPath}`);
} else {
  console.warn('WEBHOOK_URL is not set — bot will not receive Telegram updates');
}

const handleUpdate = webhookCallback(bot, 'bun');

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === webhookPath) {
      return handleUpdate(req);
    }
    if (url.pathname === '/health') {
      return new Response('OK');
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Bot server running on port ${port}`);

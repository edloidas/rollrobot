import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { config } from './config';

const { token, webhookUrl, webhookSecret, port } = config;

if (!token) {
  console.error('TOKEN environment variable is required');
  process.exit(1);
}

const bot = createBot(token);
const webhookPath = `/bot${token}`;

const handleUpdate = webhookCallback(bot, 'bun', {
  secretToken: webhookSecret || undefined,
});

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

try {
  await bot.api.setMyCommands([
    { command: 'roll', description: 'Roll dice — /roll [notation]' },
    { command: 'full', description: 'Roll with details — /full [notation]' },
    { command: 'random', description: 'Roll d100' },
    { command: 'help', description: 'Show help and notation guide' },
  ]);
} catch (err) {
  console.error('Failed to register commands:', err);
}

if (webhookUrl) {
  try {
    await bot.api.setWebhook(`${webhookUrl}${webhookPath}`, {
      secret_token: webhookSecret || undefined,
      allowed_updates: ['message', 'inline_query'],
      drop_pending_updates: true,
    });
    console.log('Webhook registered');
    if (!webhookSecret) {
      console.warn('WEBHOOK_SECRET is not set — webhook requests are not authenticated');
    }
  } catch (err) {
    console.error('Failed to register webhook:', err);
  }
} else {
  console.warn('WEBHOOK_URL is not set — bot will not receive Telegram updates');
}

import { Bot } from 'grammy';
import { ALLOWED_UPDATES, BOT_COMMANDS } from '../src/telegram';

const token = process.env.TOKEN || '';
const webhookUrl = process.env.WEBHOOK_URL || '';
const webhookSecret = process.env.WEBHOOK_SECRET || '';

if (!token) {
  throw new Error('TOKEN environment variable is required');
}

if (!webhookUrl) {
  throw new Error('WEBHOOK_URL environment variable is required');
}

if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET environment variable is required');
}

const url = new URL(webhookUrl);
if (url.protocol !== 'https:') {
  throw new Error('WEBHOOK_URL must use HTTPS');
}

const bot = new Bot(token);

await bot.api.setMyCommands([...BOT_COMMANDS]);
await bot.api.setWebhook(webhookUrl, {
  secret_token: webhookSecret,
  allowed_updates: [...ALLOWED_UPDATES],
  drop_pending_updates: process.env.DROP_PENDING_UPDATES === 'true',
});

console.log(`Telegram webhook configured for ${url.origin}${url.pathname}`);

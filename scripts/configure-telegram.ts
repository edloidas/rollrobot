import { Bot } from 'grammy';
import { DEFAULT_LOCALE, messages, SUPPORTED_LOCALES } from '../src/i18n';
import { ALLOWED_UPDATES } from '../src/telegram';

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

// Default entries answer every language Telegram has no explicit set for
const fallback = messages(DEFAULT_LOCALE);
await bot.api.setMyCommands([...fallback.commands]);
await bot.api.setMyDescription(fallback.description);
await bot.api.setMyShortDescription(fallback.shortDescription);

// ! `language_code` takes two-letter ISO 639-1 codes only — no regional variants
for (const locale of SUPPORTED_LOCALES.filter((code) => code !== DEFAULT_LOCALE)) {
  const { commands, description, shortDescription } = messages(locale);
  await bot.api.setMyCommands([...commands], { language_code: locale });
  await bot.api.setMyDescription(description, { language_code: locale });
  await bot.api.setMyShortDescription(shortDescription, { language_code: locale });
}

console.log(`Localized commands and descriptions for: ${SUPPORTED_LOCALES.join(', ')}`);

await bot.api.setWebhook(webhookUrl, {
  secret_token: webhookSecret,
  allowed_updates: [...ALLOWED_UPDATES],
  drop_pending_updates: process.env.DROP_PENDING_UPDATES === 'true',
});

console.log(`Telegram webhook configured for ${url.origin}${url.pathname}`);

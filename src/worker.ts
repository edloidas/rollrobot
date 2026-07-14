import { BotError, GrammyError, webhookCallback } from 'grammy/web';
import { createBot } from './bot';

export interface Env {
  TOKEN: string;
  WEBHOOK_SECRET: string;
}

const WEBHOOK_PATH = '/webhook';

let token: string | undefined;
let webhookSecret: string | undefined;
let handleUpdate: ReturnType<typeof webhookCallback> | undefined;

function getUpdateHandler(env: Env): ReturnType<typeof webhookCallback> {
  if (!handleUpdate || token !== env.TOKEN || webhookSecret !== env.WEBHOOK_SECRET) {
    token = env.TOKEN;
    webhookSecret = env.WEBHOOK_SECRET;
    handleUpdate = webhookCallback(createBot(env.TOKEN), 'cloudflare-mod', {
      secretToken: env.WEBHOOK_SECRET,
    });
  }

  return handleUpdate;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response('OK');
    }

    if (request.method === 'POST' && url.pathname === WEBHOOK_PATH) {
      if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        return await getUpdateHandler(env)(request);
      } catch (error) {
        const cause = error instanceof BotError ? error.error : error;
        if (!(cause instanceof GrammyError)) {
          console.error('Webhook error:', cause instanceof Error ? cause.message : cause);
        }
        return new Response('OK');
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

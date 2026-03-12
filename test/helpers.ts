import type { Bot } from 'grammy';
import { createBot } from '../src/bot';

// ? Fake token that passes grammY validation (numeric:alphanumeric)
const FAKE_TOKEN = '0123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

let updateId = 0;

function nextUpdateId(): number {
  updateId += 1;
  return updateId;
}

function extractCommandEntity(text: string) {
  const match = text.match(/^\/\w+(@\w+)?/);
  if (!match) return [];
  return [{ type: 'bot_command', offset: 0, length: match[0].length }];
}

function createMessageUpdate(text: string, chatType = 'private') {
  return {
    update_id: nextUpdateId(),
    message: {
      message_id: nextUpdateId(),
      date: Math.floor(Date.now() / 1000),
      text,
      entities: extractCommandEntity(text),
      from: { id: 1, is_bot: false, first_name: 'Test', username: 'testuser' },
      chat: { id: 1, type: chatType, first_name: 'Test' },
    },
  };
}

function createInlineQueryUpdate(query: string) {
  return {
    update_id: nextUpdateId(),
    inline_query: {
      id: String(nextUpdateId()),
      query,
      offset: '',
      from: { id: 1, is_bot: false, first_name: 'Test', username: 'testuser' },
    },
  };
}

export class TestBot {
  bot: Bot;
  replies: any[] = [];
  inlineResults: any[] = [];

  constructor() {
    this.bot = createBot(FAKE_TOKEN);

    // Provide fake bot info so handleUpdate works without calling bot.init()
    this.bot.botInfo = {
      id: 123456789,
      is_bot: true,
      first_name: 'TestBot',
      username: 'testbot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: true,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
    };

    // Intercept outgoing API calls
    this.bot.api.config.use((prev, method, payload) => {
      if (method === 'sendMessage') {
        this.replies.push(payload);
        return { ok: true, result: { message_id: nextUpdateId() } } as any;
      }
      if (method === 'answerInlineQuery') {
        this.inlineResults.push(payload);
        return { ok: true, result: true } as any;
      }
      return { ok: true, result: {} } as any;
    });
  }

  clear() {
    this.replies = [];
    this.inlineResults = [];
  }

  async send(text: string, chatType = 'private'): Promise<string> {
    this.clear();
    const update = createMessageUpdate(text, chatType);
    await this.bot.handleUpdate(update as any);
    return this.replies[0]?.text || '';
  }

  async sendInline(query: string): Promise<any[]> {
    this.clear();
    const update = createInlineQueryUpdate(query);
    await this.bot.handleUpdate(update as any);
    return this.inlineResults[0]?.results || [];
  }

  getLastReplyOptions(): any {
    return this.replies[this.replies.length - 1] || {};
  }
}

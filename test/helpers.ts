import type { Bot } from 'grammy/web';
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

function createSender(languageCode?: string) {
  return {
    id: 1,
    is_bot: false,
    first_name: 'Test',
    username: 'testuser',
    ...(languageCode ? { language_code: languageCode } : {}),
  };
}

function createMessageUpdate(text: string, chatType = 'private', languageCode?: string) {
  return {
    update_id: nextUpdateId(),
    message: {
      message_id: nextUpdateId(),
      date: Math.floor(Date.now() / 1000),
      text,
      entities: extractCommandEntity(text),
      from: createSender(languageCode),
      chat: { id: 1, type: chatType, first_name: 'Test' },
    },
  };
}

function createInlineQueryUpdate(query: string, languageCode?: string) {
  return {
    update_id: nextUpdateId(),
    inline_query: {
      id: String(nextUpdateId()),
      query,
      offset: '',
      from: createSender(languageCode),
    },
  };
}

function createChosenInlineResultUpdate(resultId: string, query: string) {
  return {
    update_id: nextUpdateId(),
    chosen_inline_result: {
      result_id: resultId,
      query,
      from: createSender(),
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
      supports_join_request_queries: false,
      can_connect_to_business: false,
      can_manage_bots: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
    };

    // Intercept outgoing API calls
    this.bot.api.config.use((_prev, method, payload) => {
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

  async send(text: string, chatType = 'private', languageCode?: string): Promise<string> {
    this.clear();
    const update = createMessageUpdate(text, chatType, languageCode);
    await this.bot.handleUpdate(update as any);
    return this.replies[0]?.text || '';
  }

  async sendInline(query: string, languageCode?: string): Promise<any[]> {
    this.clear();
    const update = createInlineQueryUpdate(query, languageCode);
    await this.bot.handleUpdate(update as any);
    return this.inlineResults[0]?.results || [];
  }

  async sendChosenInline(resultId: string, query = ''): Promise<void> {
    this.clear();
    const update = createChosenInlineResultUpdate(resultId, query);
    await this.bot.handleUpdate(update as any);
  }

  getLastReplyOptions(): any {
    return this.replies[this.replies.length - 1] || {};
  }
}

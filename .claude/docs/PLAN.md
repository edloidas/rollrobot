# Bun + TypeScript + grammY Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate rollrobot from Node.js/JavaScript/Jest/ESLint to Bun/TypeScript/bun-test/Biome, replace `node-telegram-bot-api` with grammY, and target Railway webhook deployment.

**Architecture:** grammY bot with `Bun.serve` webhook entry point. Handlers are pure functions that take notation strings and return response strings. Bot module registers grammY commands that delegate to these handlers. Tests mock grammY Context to verify handler behavior.

**Tech Stack:** Bun, TypeScript, grammY, Biome, bun-test, roll-parser

---

### Task 1: Scaffold Bun + TypeScript + Biome infrastructure

**Files:**
- Create: `tsconfig.json`
- Create: `biome.json`
- Modify: `package.json` (full rewrite of scripts, deps, engine)
- Modify: `.gitignore`
- Delete: `.eslintrc.js`, `.eslintignore`, `.editorconfig`, `pnpm-lock.yaml`, `vercel.json`

**Step 1: Initialize Bun and install dependencies**

```bash
rm -f pnpm-lock.yaml
bun init -y
bun add grammy roll-parser
bun add -d @biomejs/biome bun-types typescript
```

**Step 2: Write `tsconfig.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["bun-types"],

    "strict": false,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    "declaration": false,
    "sourceMap": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Write `biome.json`**

Adapted from roll-parser with relaxed rules for migration phase.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "noVar": "error"
      },
      "suspicious": {
        "noExplicitAny": "off"
      },
      "complexity": {
        "noForEach": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "include": ["src/**/*.ts", "test/**/*.ts"],
    "ignore": ["node_modules", "dist", "coverage"]
  }
}
```

**Step 4: Rewrite `package.json`**

```json
{
  "name": "rollrobot",
  "version": "3.0.0",
  "description": "Roll Robot is a Telegram bot for dice rolling.",
  "keywords": ["rollrobot", "telegram", "bot", "roll", "dice", "random"],
  "homepage": "https://github.com/edloidas/rollrobot",
  "bugs": {
    "url": "https://github.com/edloidas/rollrobot/issues",
    "email": "edloidas@gmail.com"
  },
  "license": "MIT",
  "author": "Mikita Taukachou <edloidas@gmail.com> (https://edloidas.io)",
  "repository": {
    "type": "git",
    "url": "https://github.com/edloidas/rollrobot.git"
  },
  "type": "module",
  "scripts": {
    "start": "bun src/index.ts",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "bun typecheck && bun lint && bun format:check",
    "check:fix": "bun typecheck && bun lint:fix && bun format",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "validate": "bun run check && bun test"
  },
  "dependencies": {
    "grammy": "^1.41.0",
    "roll-parser": "^2.3.2"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "bun-types": "latest",
    "typescript": "^5.7.2"
  }
}
```

**Step 5: Update `.gitignore`**

Replace full contents:

```
# Directories
node_modules/
coverage/
dist/
temp/

# AI
.claude/settings.local.json
.claude/plans/
.claude/notes/

# Files
npm-debug.log
bun.lock

.DS_Store
Desktop.ini

*.sh
*.bat
*.cmd
```

**Step 6: Delete old config files**

```bash
rm -f .eslintrc.js .eslintignore .editorconfig vercel.json
```

**Step 7: Run `bun install` to generate lockfile and verify setup**

```bash
bun install
bun typecheck
```

Expected: `tsc` passes (no `.ts` source files yet, so nothing to check).

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Bun + TypeScript + Biome infrastructure"
```

---

### Task 2: Port core logic modules (text, limiter, options, config)

These modules have no bot-library dependency. Port them to TypeScript/ESM with minimal type changes.

**Files:**
- Create: `src/text.ts`
- Create: `src/limiter.ts`
- Create: `src/config.ts`
- Delete (later): `src/text.js`, `src/limiter.js`, `src/config.js`, `src/options.js`

**Step 1: Write `src/text.ts`**

Port from `src/text.js`. Unchanged logic, just ESM syntax.

```typescript
export const helpText = `Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes several commands and can be used in inline mode:

@rollrobot [notation] — inline request, recognizes both notations
/roll [notation] — default roll, recognizes both notations
/full [notation] — same to '/roll', but shows roll for each dice
/random — 'd100' roll

*Notation:*
*1.* Classic
    \`[count]d[dice]±[modifier]\`
*2.* World of Darkness
    \`[count]d[dice][!]>[success]f[fail]\`
*3.* Simplfied (classic, space separated)
    \`[count] [dice] [modifier]\`
*4.* Single-valued
    \`[dice]\`
where ...
  • \`count\` — number of rolls
  • \`dice\` — dice type
  • \`modifier\` — value, that will be added or subtracted from result
  • \`!\` — sign, indicating to repeat
  • \`success\` — minimum roll value, that counts as success
  • \`fail\` — maximum roll value, that counts as fail

*Examples:*
\`/roll 20\` ➜ 'd20'
\`/roll 2 10 -1\` ➜ result of '2d10-1'
\`/roll 4d8+3\` ➜ result of '4d8+3'
\`/wod 6d10!>6f1\` ➜ number of successes for '6d10!>6f1'
\`/random\` ➜ 'd100'

Rate the bot, if you like it.
https://telegram.me/storebot?start=rollrobot

Your ideas on improvement are welcome.

MIT © @edloidas`;

export const deprecatedText =
  '`/sroll` and `/droll` commands are no longer supported. Use /help for more details.';

export const errorText = "_Sorry, can't parse notation._";

export function createResultMessage(result: any): string | null {
  if (result) {
    return `\`(${result.notation})\` *${result.value}*`;
  }
  return null;
}

export function createFullResultMessage(result: any): string | null {
  if (result) {
    const rolls = result.rolls.join();
    return `\`(${result.notation})\` *${result.value}* \`[${rolls}]\``;
  }
  return null;
}
```

**Step 2: Write `src/limiter.ts`**

Port from `src/limiter.js`. Uses `roll-parser` types.

```typescript
import { Roll, WodRoll } from 'roll-parser';

const MAX_DICE = 999999999;
const MAX_COUNT = 12;
const MIN_MOD = -999999999;
const MAX_MOD = 999999999;
const MAX_SUCCESS = 999999999;
const MAX_FAIL = 999999998;

export function limit(roll: any): any {
  if (roll instanceof Roll) {
    const dice = Math.min(roll.dice, MAX_DICE);
    const count = Math.min(roll.count, MAX_COUNT);
    const modifier = Math.max(Math.min(roll.modifier, MAX_MOD), MIN_MOD);
    return new Roll(dice, count, modifier);
  }
  if (roll instanceof WodRoll) {
    const dice = Math.min(roll.dice, MAX_DICE);
    const count = Math.min(roll.count, MAX_COUNT);
    const success = Math.min(roll.success, MAX_SUCCESS);
    const fail = Math.min(roll.fail, MAX_FAIL);
    return new WodRoll(dice, count, roll.again, success, fail);
  }
  return null;
}
```

**Step 3: Write `src/config.ts`**

Simplified for Railway webhook deployment.

```typescript
export const config = {
  token: process.env.TOKEN || '',
  webhookUrl: process.env.WEBHOOK_URL || '',
  port: Number(process.env.PORT) || 3000,
};
```

**Step 4: Verify typecheck**

```bash
bun typecheck
```

Expected: passes (or reports missing `roll-parser` types — that's fine, `skipLibCheck` handles it).

**Step 5: Commit**

```bash
git add src/text.ts src/limiter.ts src/config.ts
git commit -m "refactor: port core logic modules to TypeScript"
```

---

### Task 3: Port command handlers to grammY

Convert each handler to a pure function + grammY command registration. The handlers themselves stay as pure functions (notation → response string) for testability.

**Files:**
- Create: `src/handlers/roll.ts`
- Create: `src/handlers/full.ts`
- Create: `src/handlers/random.ts`
- Create: `src/handlers/help.ts`
- Create: `src/handlers/deprecated.ts`
- Create: `src/handlers/inline.ts`

**Step 1: Write `src/handlers/roll.ts`**

```typescript
import { parse, roll } from 'roll-parser';
import { createResultMessage, errorText } from '../text';
import { limit } from '../limiter';

export function rollReply(notation: string): string {
  const result = roll(limit(parse(notation)));
  return createResultMessage(result) || errorText;
}
```

**Step 2: Write `src/handlers/full.ts`**

```typescript
import { parse, roll } from 'roll-parser';
import { createFullResultMessage, errorText } from '../text';
import { limit } from '../limiter';

export function fullReply(notation: string): string {
  const result = roll(limit(parse(notation)));
  return createFullResultMessage(result) || errorText;
}
```

**Step 3: Write `src/handlers/random.ts`**

```typescript
import { parseAndRollSimple } from 'roll-parser';

export function randomReply(): string {
  const result = parseAndRollSimple('100');
  return `\`(${result.notation})\` *${result.value}*`;
}
```

**Step 4: Write `src/handlers/help.ts`**

```typescript
import { helpText } from '../text';

export function helpReply(): string {
  return helpText;
}
```

**Step 5: Write `src/handlers/deprecated.ts`**

```typescript
import { deprecatedText } from '../text';

export function deprecatedReply(): string {
  return deprecatedText;
}
```

**Step 6: Write `src/handlers/inline.ts`**

Replace `nanoid` with `crypto.randomUUID()` (built into Bun).

```typescript
import {
  parseAndRollSimple,
  parseClassicRoll,
  parseSimpleRoll,
  parseWodRoll,
  roll,
} from 'roll-parser';
import type { InlineQueryResult } from 'grammy/types';
import { limit } from '../limiter';
import { createFullResultMessage } from '../text';

function createInputMessageContent(text: string) {
  return {
    message_text: text,
    parse_mode: 'Markdown' as const,
    disable_web_page_preview: true,
  };
}

function createArticle(
  title: string,
  description: string,
  message: string,
): InlineQueryResult {
  return {
    type: 'article',
    id: crypto.randomUUID(),
    title,
    input_message_content: createInputMessageContent(message),
    description,
  };
}

function createRollArticle(notation: string): InlineQueryResult | null {
  const title = 'Classic';
  const result = roll(limit(parseClassicRoll(notation || 'd20') || parseSimpleRoll(notation)));
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message) : null;
}

function createWodArticle(notation: string): InlineQueryResult | null {
  const title = 'World of Darkness';
  const result = roll(limit(parseWodRoll(notation || 'd10')));
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message) : null;
}

function createRandomArticle(): InlineQueryResult | null {
  const title = 'Random';
  const result = parseAndRollSimple('100');
  const message = result && createFullResultMessage(result);
  return result && message ? createArticle(title, result.notation, message) : null;
}

export function createInlineArticles(query = ''): InlineQueryResult[] {
  const notation = query.trim();
  const articles = [
    createRollArticle(notation),
    createWodArticle(notation),
    createRandomArticle(),
  ];
  return articles.filter((article): article is InlineQueryResult => article != null);
}
```

**Step 7: Verify typecheck**

```bash
bun typecheck
```

**Step 8: Commit**

```bash
git add src/handlers/
git commit -m "refactor: port command handlers to TypeScript with grammY types"
```

---

### Task 4: Create bot module and webhook entry point

**Files:**
- Create: `src/bot.ts`
- Create: `src/index.ts`

**Step 1: Write `src/bot.ts`**

This creates the Bot instance and registers all command handlers. The `createBot` function is exported for testing.

```typescript
import { Bot } from 'grammy';
import { rollReply } from './handlers/roll';
import { fullReply } from './handlers/full';
import { randomReply } from './handlers/random';
import { helpReply } from './handlers/help';
import { deprecatedReply } from './handlers/deprecated';
import { createInlineArticles } from './handlers/inline';

const GROUPS = ['group', 'supergroup', 'channel'];

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.command(['start', 'help'], async (ctx) => {
    await ctx.reply(helpReply(), {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    });
  });

  bot.command('roll', async (ctx) => {
    const notation = (ctx.match as string) || '';
    const response = rollReply(notation);
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup ? { reply_parameters: { message_id: ctx.msgId } } : {}),
    });
  });

  bot.command('full', async (ctx) => {
    const notation = (ctx.match as string) || '';
    const response = fullReply(notation);
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup ? { reply_parameters: { message_id: ctx.msgId } } : {}),
    });
  });

  bot.command('random', async (ctx) => {
    const response = randomReply();
    const isGroup = GROUPS.includes(ctx.chat.type);
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
      ...(isGroup ? { reply_parameters: { message_id: ctx.msgId } } : {}),
    });
  });

  bot.command(['sroll', 'droll'], async (ctx) => {
    await ctx.reply(deprecatedReply(), {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    });
  });

  bot.on('inline_query', async (ctx) => {
    const results = createInlineArticles(ctx.inlineQuery.query);
    await ctx.answerInlineQuery(results, { cache_time: 0 });
  });

  return bot;
}
```

**Step 2: Write `src/index.ts`**

Webhook entry point using `Bun.serve` and grammY's `webhookCallback`.

```typescript
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

const handleUpdate = webhookCallback(bot, 'std:http');

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
```

**Step 3: Verify typecheck**

```bash
bun typecheck
```

**Step 4: Commit**

```bash
git add src/bot.ts src/index.ts
git commit -m "feat: add grammY bot module and Bun webhook entry point"
```

---

### Task 5: Create test helpers and port tests

**Files:**
- Create: `test/helpers.ts`
- Create: `test/handlers/roll.test.ts`
- Create: `test/handlers/full.test.ts`
- Create: `test/handlers/random.test.ts`
- Create: `test/handlers/help.test.ts`
- Create: `test/handlers/deprecated.test.ts`
- Create: `test/handlers/inline.test.ts`
- Create: `test/bot.test.ts`

**Step 1: Write `test/helpers.ts`**

Provides a `createMockContext` that fakes enough of grammY's Context to test bot handlers, and a `TestBot` class for integration-style tests that sends fake Updates through the bot.

```typescript
import { Bot, type Context } from 'grammy';
import { createBot } from '../src/bot';

// ? Fake token that passes grammY validation (numeric:alphanumeric)
const FAKE_TOKEN = '0123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

let updateId = 0;

function nextUpdateId(): number {
  updateId += 1;
  return updateId;
}

function createMessageUpdate(text: string, chatType = 'private') {
  return {
    update_id: nextUpdateId(),
    message: {
      message_id: nextUpdateId(),
      date: Math.floor(Date.now() / 1000),
      text,
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
```

**Step 2: Write `test/handlers/roll.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { errorText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/roll', () => {
  test('should notify of invalid input', async () => {
    expect(await bot.send('/roll')).toEqual(errorText);
    expect(await bot.send('/roll a')).toEqual(errorText);
    expect(await bot.send('/roll -7')).toEqual(errorText);
    expect(await bot.send('/roll 6d')).toEqual(errorText);
  });

  test('should parse and roll notation', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\*/;
    expect(await bot.send('/roll 10')).toMatch(pattern);
    expect(await bot.send('/roll d20')).toMatch(pattern);
    expect(await bot.send('/roll d8!')).toMatch(pattern);
    expect(await bot.send('/roll 4d20-1')).toMatch(pattern);
    expect(await bot.send('/roll 3d10!>6f3')).toMatch(pattern);
  });

  test('should limit roll values', async () => {
    const classicPattern = /`\(12d999999999(\+|-)999999999\)` \*\d+\*/;
    const wodPattern = /`\(12d999999999!>999999999f999999998\)` \*\d+\*/;

    expect(await bot.send('/roll 100d1234567890+1234567890')).toMatch(classicPattern);
    expect(await bot.send('/roll 77d7777777777-7777777777')).toMatch(classicPattern);
    expect(await bot.send('/roll 999d1234567890!>7777777777f1111111111')).toMatch(wodPattern);
  });
});
```

**Step 3: Write `test/handlers/full.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { errorText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/full', () => {
  test('should notify of invalid input', async () => {
    expect(await bot.send('/full')).toEqual(errorText);
    expect(await bot.send('/full a')).toEqual(errorText);
    expect(await bot.send('/full -7')).toEqual(errorText);
    expect(await bot.send('/full 6d')).toEqual(errorText);
  });

  test('should parse and roll notation with individual rolls', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    expect(await bot.send('/full 10')).toMatch(pattern);
    expect(await bot.send('/full d20')).toMatch(pattern);
    expect(await bot.send('/full d8!')).toMatch(pattern);
    expect(await bot.send('/full 4d20-1')).toMatch(pattern);
    expect(await bot.send('/full 3d10!>6f3')).toMatch(pattern);
  });

  test('should work in group chats with reply', async () => {
    const pattern = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    expect(await bot.send('/full 10', 'group')).toMatch(pattern);

    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should limit roll values', async () => {
    const classicPattern = /`\(12d999999999(\+|-)999999999\)` \*\d+\*/;
    const wodPattern = /`\(12d999999999!>999999999f999999998\)` \*\d+\*/;

    expect(await bot.send('/full 100d1234567890+1234567890')).toMatch(classicPattern);
    expect(await bot.send('/full 77d7777777777-7777777777')).toMatch(classicPattern);
    expect(await bot.send('/full 999d1234567890!>7777777777f1111111111')).toMatch(wodPattern);
  });
});
```

**Step 4: Write `test/handlers/random.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/random', () => {
  test('should reply with d100 roll', async () => {
    const pattern = /`\(d100\)` \*\d{1,3}\*/;
    expect(await bot.send('/random')).toMatch(pattern);
  });

  test('should ignore extra arguments', async () => {
    const pattern = /`\(d100\)` \*\d{1,3}\*/;
    expect(await bot.send('/random d100+1000')).toMatch(pattern);
  });
});
```

**Step 5: Write `test/handlers/help.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { helpText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Help commands', () => {
  test('should reply with help text for /start', async () => {
    expect(await bot.send('/start')).toEqual(helpText);
  });

  test('should reply with help text for /help', async () => {
    expect(await bot.send('/help')).toEqual(helpText);
  });
});
```

**Step 6: Write `test/handlers/deprecated.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { deprecatedText } from '../../src/text';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Deprecated commands', () => {
  test('should reply with notice for /sroll', async () => {
    expect(await bot.send('/sroll')).toEqual(deprecatedText);
  });

  test('should reply with notice for /droll', async () => {
    expect(await bot.send('/droll')).toEqual(deprecatedText);
  });
});
```

**Step 7: Write `test/handlers/inline.test.ts`**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

function expectArticles(results: any[], expected: { title: string; description?: string }[]) {
  expect(results.length).toEqual(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(results[i]).toMatchObject(expected[i]);
  }
}

describe('Inline queries', () => {
  test('should return default articles for empty query', async () => {
    const results = await bot.sendInline('');
    expectArticles(results, [
      { title: 'Classic', description: 'd20' },
      { title: 'World of Darkness', description: 'd10>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should return only random article for invalid query', async () => {
    const results = await bot.sendInline('abc');
    expectArticles(results, [{ title: 'Random', description: 'd100' }]);
  });

  test('should return matching articles for valid notation', async () => {
    const results = await bot.sendInline('d20');
    expectArticles(results, [
      { title: 'Classic', description: 'd20' },
      { title: 'World of Darkness', description: 'd20>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should limit inline query roll values', async () => {
    const results = await bot.sendInline('d9999999999');
    expectArticles(results, [
      { title: 'Classic', description: 'd999999999' },
      { title: 'World of Darkness', description: 'd999999999>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });
});
```

**Step 8: Write `test/bot.test.ts`**

Integration test for group-chat reply behavior and message options.

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from './helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('Bot message options', () => {
  test('should reply with Markdown parse mode', async () => {
    await bot.send('/roll d20');
    const opts = bot.getLastReplyOptions();
    expect(opts.parse_mode).toEqual('Markdown');
  });

  test('should include reply_parameters in group chats', async () => {
    await bot.send('/roll d20', 'group');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
    expect(opts.reply_parameters.message_id).toBeDefined();
  });

  test('should include reply_parameters in supergroup chats', async () => {
    await bot.send('/roll d20', 'supergroup');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeDefined();
  });

  test('should not include reply_parameters in private chats', async () => {
    await bot.send('/roll d20', 'private');
    const opts = bot.getLastReplyOptions();
    expect(opts.reply_parameters).toBeUndefined();
  });
});
```

**Step 9: Run tests**

```bash
bun test
```

Expected: all tests pass.

**Step 10: Commit**

```bash
git add test/
git commit -m "test: add bun test suite with grammY mock helpers"
```

---

### Task 6: Delete old files, run Biome, update CLAUDE.md

**Files:**
- Delete: `index.js`, `src/config.js`, `src/handlers.js`, `src/limiter.js`, `src/options.js`, `src/text.js`
- Delete: `src/query/` (entire directory)
- Delete: `test/EnhancedTelegramTest.js`, `test/utils.js`, `test/options.spec.js`
- Delete: `test/query/` (entire directory)
- Modify: `CLAUDE.md`
- Modify: `.github/workflows/*.yml`

**Step 1: Delete old source files**

```bash
rm -f index.js
rm -rf src/query/
rm -f src/config.js src/handlers.js src/limiter.js src/options.js src/text.js
rm -f test/EnhancedTelegramTest.js test/utils.js test/options.spec.js
rm -rf test/query/
```

**Step 2: Run Biome lint and format**

```bash
bun lint:fix
bun format
```

Fix any issues reported.

**Step 3: Run full validation**

```bash
bun validate
```

Expected: typecheck passes, lint passes, format passes, all tests pass.

**Step 4: Update `CLAUDE.md`**

```markdown
# rollrobot

Telegram bot for dice rolling. TypeScript, Bun, grammY. Uses `roll-parser` for notation parsing.

## Commands

```bash
bun check:fix   # Typecheck + lint + format with auto-fix
bun test        # Run tests
bun validate    # Full check: typecheck + lint + format:check + test
```

## Constraints

- Runtime: Bun
- Language: TypeScript (relaxed — `any` allowed during migration)
- Bot framework: grammY with webhook mode
- Deployment: Railway

## Git & GitHub

Conventional Commits: `<type>: <description> #<issue>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

- Imperative mood, under 72 chars, no period
- Include issue number when related: `feat: add parser #5`
- `Co-Authored-By:` trailer only, no promotional lines
- Optional body: past tense, one line per change, backticks for code refs

### Issues

- **Title**: `<type>: <description>`
- Use `epic: <description>` for issues that aggregate sub-issues and describe a long-form implementation plan. Not used in commits.
- **Body**: concisely explain what and why, skip trivial details

  ```
  <4–8 sentence description: what, what's affected, how to reproduce, impact>

  ##### Rationale
  <why this needs to be fixed or implemented>

  <sub>Drafted with AI assistance</sub>
  ```

### Pull Requests

- **Title**: `<type>: <description> #<number>`
- **Body**: concise, no emojis, separate all sections with one blank line

  ```
  <summary of changes>

  Closes #<number>

  [Claude Code session](<link>)

  <sub>Drafted with AI assistance</sub>
  ```
```

**Step 5: Update `.github/workflows/test.yml`**

```yaml
name: Rollrobot Test Workflow

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Typecheck
        run: bun typecheck

      - name: Lint
        run: bun lint

      - name: Format check
        run: bun format:check

      - name: Test
        run: bun test
```

**Step 6: Update `.claude/settings.local.json`**

Replace npm/pnpm permissions with bun permissions (match roll-parser pattern).

**Step 7: Run final validation**

```bash
bun validate
```

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove old JS files, update CI and project config for Bun"
```

---

### Task 7: Final verification

**Step 1: Run full validation one more time**

```bash
bun validate
```

**Step 2: Verify the bot starts without errors (dry run)**

```bash
timeout 3 bun start 2>&1 || true
```

Expected: prints "TOKEN environment variable is required" and exits (no token set locally — that's correct).

**Step 3: Verify project tree looks clean**

```bash
tree -I node_modules -L 3
```

Expected structure:
```
.
├── CLAUDE.md
├── LICENSE
├── README.md
├── biome.json
├── bun.lock
├── docs/
│   └── plans/
│       ├── 2026-03-01-bun-migration-design.md
│       └── 2026-03-01-bun-migration.md
├── package.json
├── src/
│   ├── bot.ts
│   ├── config.ts
│   ├── handlers/
│   │   ├── deprecated.ts
│   │   ├── full.ts
│   │   ├── help.ts
│   │   ├── inline.ts
│   │   ├── random.ts
│   │   └── roll.ts
│   ├── index.ts
│   ├── limiter.ts
│   └── text.ts
├── test/
│   ├── bot.test.ts
│   ├── handlers/
│   │   ├── deprecated.test.ts
│   │   ├── full.test.ts
│   │   ├── help.test.ts
│   │   ├── inline.test.ts
│   │   ├── random.test.ts
│   │   └── roll.test.ts
│   └── helpers.ts
└── tsconfig.json
```

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

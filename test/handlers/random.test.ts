import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const pattern = /^<b>\d{1,3}<\/b>$/;

describe('/random', () => {
  test('should reply with the d100 total alone', async () => {
    expect(await bot.send('/random')).toMatch(pattern);
  });

  test('should ignore extra arguments', async () => {
    expect(await bot.send('/random d100+1000')).toMatch(pattern);
  });

  test('should quote the label above the total', async () => {
    expect(await bot.send('/random "Is this a good bot?"')).toMatch(
      /^<blockquote>Is this a good bot\?<\/blockquote>\n<b>\d{1,3}<\/b>$/,
    );
  });

  // The notation half stays ignored, as it is without a label
  test('should keep the label when arguments precede it', async () => {
    expect(await bot.send('/random d6 "note"')).toMatch(
      /^<blockquote>note<\/blockquote>\n<b>\d{1,3}<\/b>$/,
    );
  });
});

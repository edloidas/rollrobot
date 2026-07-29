import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

describe('/roll', () => {
  test('should explain invalid input with the error span', async () => {
    expect(await bot.send('/roll a')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/roll 6d')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/roll 4d6d1')).toMatch(/<pre>4d6d1\n {3}\^/);
  });

  test('should parse and roll notation', async () => {
    const pattern = /^<code>[^<]+<\/code> = <b>-?\d+<\/b>$/;
    expect(await bot.send('/roll')).toMatch(pattern);
    expect(await bot.send('/roll d20')).toMatch(pattern);
    expect(await bot.send('/roll d8!')).toMatch(pattern);
    expect(await bot.send('/roll 4d20-1')).toMatch(pattern);
    expect(await bot.send('/roll 4d6kh3')).toMatch(pattern);
  });

  test('should report success counts for dice pools', async () => {
    const reply = await bot.send('/roll 10d10>=6f1');
    expect(reply).toMatch(/^<code>10d10&gt;=6f1<\/code> = <b>\d+<\/b> success(es)?/);
  });

  test('should report degree of success for vs checks', async () => {
    const reply = await bot.send('/roll 1d20+7 vs 15');
    expect(reply).toMatch(
      /^<code>1d20 \+ 7 vs 15<\/code> = <b>(Critical )?(Success|Failure)<\/b> \(natural \d+\)$/,
    );
  });

  test('should reject rolls above the dice limit', async () => {
    expect(await bot.send('/roll 999d6')).toMatch(/^<i>.+<\/i>/);
    expect(await bot.send('/roll 101d20')).toMatch(/^<i>.+<\/i>/);
  });
});

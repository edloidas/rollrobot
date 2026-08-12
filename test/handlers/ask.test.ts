import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { askReply } from '../../src/handlers/ask';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const ANSWER = /^(<b>Yes<\/b> ✅|<b>No<\/b> ❌)$/;

/** The reply split into its quote and its answer; the quote is absent when nothing was asked. */
function parts(reply: string): { quote?: string; answer: string } {
  const lines = reply.split('\n');
  return lines.length === 1 ? { answer: lines[0] } : { quote: lines[0], answer: lines[1] };
}

describe('/ask', () => {
  test('should answer Yes or No with no question', async () => {
    expect(await bot.send('/ask')).toMatch(ANSWER);
  });

  test('should quote the question above the answer', async () => {
    const { quote, answer } = parts(await bot.send('/ask Should we attack the dragon?'));
    expect(quote).toEqual('<blockquote>Should we attack the dragon?</blockquote>');
    expect(answer).toMatch(ANSWER);
  });

  test('should answer through the /a shortcut', async () => {
    const { quote, answer } = parts(await bot.send('/a Do I trust him?'));
    expect(quote).toEqual('<blockquote>Do I trust him?</blockquote>');
    expect(answer).toMatch(ANSWER);
  });

  test('should give both answers over many asks', async () => {
    const answers = new Set<string>();
    for (let i = 0; i < 200; i++) {
      answers.add(parts(await bot.send('/ask Heads?')).answer);
    }
    expect(answers.size).toEqual(2);
  });

  test('should escape HTML in the question', async () => {
    const { quote } = parts(await bot.send('/ask <b>now</b> or never?'));
    expect(quote).toEqual('<blockquote>&lt;b&gt;now&lt;/b&gt; or never?</blockquote>');
  });

  // Nothing else on this path caps the question — `extractLabel` never runs
  test('should stay inside the Telegram message limit for a huge question', async () => {
    const reply = await bot.send(`/ask ${'&'.repeat(4000)}`);
    expect(reply.length).toBeLessThan(4096);
    expect(parts(reply).quote).toEndWith('…</blockquote>');
  });

  test('should not truncate a question that fits', async () => {
    const question = 'a'.repeat(300);
    expect(parts(await bot.send(`/ask ${question}`)).quote).toEqual(
      `<blockquote>${question}</blockquote>`,
    );
  });

  // grammY trims only the leading side of a command argument
  test('should trim trailing whitespace off the question', async () => {
    expect(parts(await bot.send('/ask Rain?  \n\n')).quote).toEqual(
      '<blockquote>Rain?</blockquote>',
    );
  });

  test('should keep a multi-line question inside the quote', async () => {
    expect(parts(await bot.send('/ask north\nor south?')).quote).toEqual('<blockquote>north');
  });

  test('should treat a whitespace-only question as none', async () => {
    expect(await bot.send('/ask     ')).toMatch(ANSWER);
  });

  // The quoted-label syntax is a roll feature; here the whole argument is the question
  test('should keep quotes as part of the question', async () => {
    expect(parts(await bot.send('/ask 2d6 "Perception"?')).quote).toEqual(
      '<blockquote>2d6 "Perception"?</blockquote>',
    );
  });

  describe('askReply', () => {
    test('should report the question it quoted', () => {
      expect(askReply('  Rain?  ').question).toEqual('Rain?');
      expect(askReply('').question).toBeNull();
      expect(askReply(undefined).question).toBeNull();
      expect(askReply(null).question).toBeNull();
    });

    test('should report the capped question, not the raw one', () => {
      expect(askReply('x'.repeat(400)).question).toEqual(`${'x'.repeat(299)}…`);
    });
  });
});

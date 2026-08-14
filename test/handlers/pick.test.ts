import { beforeEach, describe, expect, test } from 'bun:test';
import { messages } from '../../src/i18n';
import { pickReply } from '../../src/handlers/pick';
import { MAX_PICK_ITEMS } from '../../src/limits';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const USAGE = messages().pick.usage;
const TOO_MANY = messages().pick.tooMany;
const SPACE_SPLIT = `<i>${messages().pick.spaceSplit}</i>`;

/** The bolded winner, or `null` when the reply carries no result. */
function winner(reply: string): string | null {
  return reply.match(/<b>(.*)<\/b>/)?.[1] ?? null;
}

describe('/pick', () => {
  test('should pick one of the options', async () => {
    const reply = await bot.send('/pick Rock | Paper | Scissors');
    expect(['Rock', 'Paper', 'Scissors']).toContain(winner(reply));
  });

  test('should pick through the /p shortcut', async () => {
    expect(['a', 'b']).toContain(winner(await bot.send('/p a | b')));
  });

  test('should quote the label above the winner', async () => {
    const reply = await bot.send('/pick Sword | Bow "Which weapon?"');
    expect(reply).toStartWith('<blockquote>Which weapon?</blockquote>\n');
    expect(['Sword', 'Bow']).toContain(winner(reply));
  });

  test('should reach every option over many picks', async () => {
    const seen = new Set<string | null>();
    for (let i = 0; i < 200; i++) {
      seen.add(winner(await bot.send('/pick a | b | c')));
    }
    expect(seen).toEqual(new Set(['a', 'b', 'c']));
  });

  test('should ask for options when given fewer than two', async () => {
    expect(await bot.send('/pick')).toEqual(USAGE);
    expect(await bot.send('/pick Scissors')).toEqual(USAGE);
    expect(await bot.send('/pick    ')).toEqual(USAGE);
  });

  // A range is another bot's syntax; answering it confidently would look like it worked
  test('should not pretend a lone range is a pool', async () => {
    expect(await bot.send('/pick 1-6')).toEqual(USAGE);
  });

  test('should refuse separators with nothing between them', async () => {
    expect(await bot.send('/pick |||')).toEqual(USAGE);
    expect(await bot.send('/pick ,,,')).toEqual(USAGE);
  });

  test('should reject rather than truncate an overlong list', async () => {
    const options = Array.from({ length: MAX_PICK_ITEMS + 1 }, (_, i) => `o${i}`);
    expect(await bot.send(`/pick ${options.join(' | ')}`)).toEqual(TOO_MANY);
  });

  test('should accept a list exactly at the limit', async () => {
    const options = Array.from({ length: MAX_PICK_ITEMS }, (_, i) => `o${i}`);
    expect(options).toContain(winner(await bot.send(`/pick ${options.join(' | ')}`)));
  });

  describe('the space fallback', () => {
    test('should say when spaces did the splitting', async () => {
      expect(await bot.send('/pick attack the goblin')).toEndWith(SPACE_SPLIT);
    });

    test('should stay quiet when an explicit separator did', async () => {
      expect(await bot.send('/pick Rock | Paper')).not.toContain(SPACE_SPLIT);
      expect(await bot.send('/pick Rock, Paper')).not.toContain(SPACE_SPLIT);
      expect(await bot.send('/pick Rock\nPaper')).not.toContain(SPACE_SPLIT);
    });
  });

  describe('safety', () => {
    test('should escape HTML in the winner', async () => {
      expect(await bot.send('/pick <b>boom</b> | <b>boom</b>')).toContain(
        '<b>&lt;b&gt;boom&lt;/b&gt;</b>',
      );
    });

    test('should escape HTML in the label', async () => {
      expect(await bot.send('/pick a | b "<i>why</i>"')).toStartWith(
        '<blockquote>&lt;i&gt;why&lt;/i&gt;</blockquote>',
      );
    });

    // ! Capping escaped text would cut an entity in half and Telegram rejects the message
    test('should stay inside the Telegram limit and never split an entity', async () => {
      const huge = '&'.repeat(4000);
      const reply = await bot.send(`/pick ${huge} | ${huge}`);
      expect(reply.length).toBeLessThan(4096);
      expect(reply).toEndWith('…</b>');
      expect(reply.replace(/…<\/b>$/, '')).not.toMatch(/&[a-z]*$/);
    });

    test('should keep a mention intact so the ping still lands', async () => {
      expect(['@alice', '@bob']).toContain(winner(await bot.send('/pick @alice @bob')));
    });
  });

  describe('pickReply', () => {
    test('should report the option it chose', () => {
      const { choice, text } = pickReply('a | b');
      expect(['a', 'b']).toContain(choice);
      expect(text).toContain(`<b>${choice}</b>`);
    });

    test('should report no choice when it could not pick', () => {
      expect(pickReply('').choice).toBeNull();
      expect(pickReply(undefined).choice).toBeNull();
      expect(pickReply(null).choice).toBeNull();
      expect(pickReply('only').choice).toBeNull();
    });

    test('should answer in the requested locale', () => {
      expect(pickReply('', 'ru').text).toEqual(messages('ru').pick.usage);
      expect(pickReply('', 'de').text).toEqual(messages('de').pick.usage);
    });

    // Inline messages are sent by the user, with no command above them to give context
    test('should echo the pool only when asked to', () => {
      expect(pickReply('a | b | c', 'en', { echo: true }).text).toContain('<i>a · b · c</i>');
      expect(pickReply('a | b | c').text).not.toContain('<i>a · b · c</i>');
    });

    test('should escape the echoed pool', () => {
      expect(pickReply('<b>x</b> | y', 'en', { echo: true }).text).toContain(
        '<i>&lt;b&gt;x&lt;/b&gt; · y</i>',
      );
    });

    // ! `&` expands fivefold; a bidi control becomes `U+202E`, which is six — so the
    //   `&`-only case understates the worst expansion this path has to survive
    test('should survive the worst escaping expansion on every capped run at once', () => {
      const bidi = '‮'.repeat(4000);
      const { text } = pickReply(`${bidi} | ${bidi} "${bidi}"`, 'en', { echo: true });
      expect(text.length).toBeLessThan(4096);
      expect(text).not.toContain('‮');
    });

    test('should keep an echoed reply inside the Telegram limit', () => {
      const huge = '&'.repeat(4000);
      const { text } = pickReply(`${huge} | ${huge} "${huge}"`, 'en', { echo: true });
      expect(text.length).toBeLessThan(4096);
    });
  });
});

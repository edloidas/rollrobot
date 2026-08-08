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

  test('should support the /r shortcut', async () => {
    expect(await bot.send('/r d20')).toMatch(/^<code>1d20<\/code> = <b>\d+<\/b>$/);
    expect(await bot.send('/r')).toMatch(/^<code>1d20<\/code> = <b>\d+<\/b>$/);
  });

  test('should keep legacy shorthand working', async () => {
    expect(await bot.send('/roll 20')).toMatch(/^<code>1d20<\/code> = <b>\d+<\/b>$/);
    expect(await bot.send('/roll 2 10 -1')).toMatch(/^<code>2d10 - 1<\/code> = <b>-?\d+<\/b>$/);
    expect(await bot.send('/roll 2 10 3')).toMatch(/^<code>2d10 \+ 3<\/code> = <b>\d+<\/b>$/);
  });

  describe('named rolls', () => {
    test('should quote the label above the result', async () => {
      expect(await bot.send('/roll 2d20+1 "My message"')).toMatch(
        /^<blockquote>My message<\/blockquote>\n<code>2d20 \+ 1<\/code> = <b>\d+<\/b>$/,
      );
    });

    test('should accept every supported quote pair', async () => {
      for (const input of ['d20 "a"', "d20 'a'", 'd20 `a`', 'd20 “a”', 'd20 «a»']) {
        expect(await bot.send(`/roll ${input}`)).toStartWith('<blockquote>a</blockquote>\n');
      }
    });

    test('should roll the default when only a label is given', async () => {
      expect(await bot.send('/roll "attack"')).toMatch(
        /^<blockquote>attack<\/blockquote>\n<code>1d20<\/code> = <b>\d+<\/b>$/,
      );
    });

    test('should keep the label out of the notation', async () => {
      expect(await bot.send('/roll 2 10 -1 "shorthand"')).toMatch(
        /^<blockquote>shorthand<\/blockquote>\n<code>2d10 - 1<\/code>/,
      );
    });

    test('should escape HTML in the label', async () => {
      expect(await bot.send('/roll d20 "<b>bold</b> & co"')).toStartWith(
        '<blockquote>&lt;b&gt;bold&lt;/b&gt; &amp; co</blockquote>\n',
      );
    });

    test('should leave error replies bare', async () => {
      const reply = await bot.send('/roll xyz "my label"');
      expect(reply).not.toContain('<blockquote>');
      expect(reply).toMatch(/^<i>.+<\/i>/);
      expect(reply).toContain('<pre>xyz');
    });

    test('should leave an unterminated quote to the parser', async () => {
      const reply = await bot.send('/roll 4d6 "chars');
      expect(reply).not.toContain('<blockquote>');
      expect(reply).toMatch(/^<i>.+<\/i>/);
    });

    // ! Pins the split-then-fold order through the real command path — folding ahead of
    //   `extractLabel` would renumber every Persian roll title.
    test('should fold eastern numerals in the notation but not in the label', async () => {
      const reply = await bot.send('/roll ۲d۶ «ضربهٔ ۳»');
      expect(reply).toContain('<blockquote>ضربهٔ ۳</blockquote>');
      expect(reply).toContain('<code>2d6</code>');
    });
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';
import { messages } from '../../src/i18n';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const HELP_BUTTON = { text: messages('en').inline.help, start_parameter: 'help' };

const PRESET_ARTICLES = [
  { title: 'Roll', description: 'd20' },
  { title: 'Full', description: 'd20' },
  { title: 'Random', description: 'd100' },
];

const ASK_ARTICLE = { title: 'Ask', description: 'Answers Yes or No' };

const ANSWER = /^(<b>Yes<\/b> ✅|<b>No<\/b> ❌)$/;

function expectArticles(results: any[], expected: { title: string; description?: string }[]) {
  expect(results.length).toEqual(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(results[i]).toMatchObject(expected[i]);
  }
}

describe('Inline queries', () => {
  test('should use personal caching', async () => {
    await bot.sendInline('');
    const payload = bot.inlineResults[0];
    expect(payload.is_personal).toBe(true);
    expect(payload.cache_time).toBe(0);
  });

  test('should return preset articles for empty query', async () => {
    const results = await bot.sendInline('');
    expectArticles(results, PRESET_ARTICLES);
  });

  test('should return preset articles for whitespace-only query', async () => {
    const results = await bot.sendInline('    ');
    expectArticles(results, PRESET_ARTICLES);
  });

  test('should return preset articles for bare "d" query', async () => {
    const results = await bot.sendInline('d');
    expectArticles(results, PRESET_ARTICLES);
  });

  test('should lead with the ask article for a query that is not notation', async () => {
    const results = await bot.sendInline('abc');
    expectArticles(results, [ASK_ARTICLE, ...PRESET_ARTICLES]);
  });

  test('should prefix preset article ids with their variant', async () => {
    const results = await bot.sendInline('');
    expect(results.map((r) => r.id.split(':')[0])).toEqual(['roll', 'full', 'random']);
  });

  test('should prefix query article ids with their variant', async () => {
    const results = await bot.sendInline('d20');
    expect(results.map((r) => r.id.split(':')[0])).toEqual(['roll', 'full']);
  });

  test('should keep article ids unique within a response', async () => {
    const results = await bot.sendInline('');
    expect(new Set(results.map((r) => r.id)).size).toEqual(results.length);
  });

  test('should return compact and detailed articles for valid notation', async () => {
    const results = await bot.sendInline('d20');
    expectArticles(results, [
      { title: 'Roll', description: '1d20' },
      { title: 'Full', description: '1d20' },
    ]);
  });

  test('should share one result between compact and detailed articles', async () => {
    const results = await bot.sendInline('d20');
    const compact = results[0].input_message_content.message_text;
    const detailed = results[1].input_message_content.message_text;
    expect(detailed.startsWith(compact)).toBe(true);
  });

  test('should not attach thumbnails to any article', async () => {
    for (const query of ['d20', '']) {
      const results = await bot.sendInline(query);
      for (const result of results) {
        expect(result.thumbnail_url).toBeUndefined();
      }
    }
  });

  test('should reply with the d100 notation and total for the random preset', async () => {
    const results = await bot.sendInline('');
    expect(results[2].input_message_content.message_text).toMatch(
      /^<code>1d100<\/code> = <b>\d{1,3}<\/b>$/,
    );
  });

  test('should localize titles for the requesting user', async () => {
    const ru = messages('ru').inline;
    expectArticles(await bot.sendInline('d20', 'ru'), [{ title: ru.roll }, { title: ru.full }]);
    expectArticles(await bot.sendInline('', 'ru'), [
      { title: ru.roll },
      { title: ru.full },
      { title: ru.random },
    ]);
  });

  test('should localize titles for a regional language tag', async () => {
    const pt = messages('pt').inline;
    expectArticles(await bot.sendInline('d20', 'pt-br'), [{ title: pt.roll }, { title: pt.full }]);
  });

  test('should fall back to English titles for unsupported languages', async () => {
    expectArticles(await bot.sendInline('d20', 'ja'), [{ title: 'Roll' }, { title: 'Full' }]);
  });

  test('should handle padded notation with whitespace', async () => {
    const results = await bot.sendInline('  11d11 ');
    expectArticles(results, [
      { title: 'Roll', description: '11d11' },
      { title: 'Full', description: '11d11' },
    ]);
  });

  test('should roll extended notation', async () => {
    const results = await bot.sendInline('4d6kh3');
    expectArticles(results, [
      { title: 'Roll', description: '4d6kh3' },
      { title: 'Full', description: '4d6kh3' },
    ]);
  });

  test('should normalize legacy shorthand', async () => {
    const results = await bot.sendInline('2 10 -1');
    expectArticles(results, [
      { title: 'Roll', description: '2d10 - 1' },
      { title: 'Full', description: '2d10 - 1' },
      ASK_ARTICLE,
    ]);
  });

  describe('Inline help button', () => {
    test('should not show help button for empty query', async () => {
      await bot.sendInline('');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should not show help button for whitespace-only query', async () => {
      await bot.sendInline('    ');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should not show help button for bare "d" query', async () => {
      await bot.sendInline('d');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should show help button for invalid query', async () => {
      await bot.sendInline('abc');
      expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
    });

    test('should not show help button for valid notation', async () => {
      await bot.sendInline('d20');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should not show help button for extended notation', async () => {
      await bot.sendInline('2d20kh1+5');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should localize the help button for the requesting user', async () => {
      await bot.sendInline('abc', 'ru');
      expect(bot.inlineResults[0].button).toEqual({
        text: messages('ru').inline.help,
        start_parameter: 'help',
      });
    });

    test('should fall back to the English help button for unsupported languages', async () => {
      await bot.sendInline('abc', 'ja');
      expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
    });
  });

  describe('Named rolls', () => {
    test('should quote the label in both article messages', async () => {
      const results = await bot.sendInline('4d6 "characteristics"');
      expectArticles(results, [
        { title: 'Roll', description: '4d6' },
        { title: 'Full', description: '4d6' },
      ]);
      for (const result of results) {
        expect(result.input_message_content.message_text).toStartWith(
          '<blockquote>characteristics</blockquote>\n',
        );
      }
    });

    // A quoted string on its own is a question as readily as it is a roll name, so it gets both
    test('should roll the default when only a label is given', async () => {
      const results = await bot.sendInline('"attack"');
      expectArticles(results, [
        ASK_ARTICLE,
        { title: 'Roll', description: '1d20' },
        { title: 'Full', description: '1d20' },
      ]);
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should name the roll from an unterminated quote', async () => {
      const results = await bot.sendInline('4d6 "chars');
      expectArticles(results, [
        { title: 'Roll', description: '4d6' },
        { title: 'Full', description: '4d6' },
      ]);
      for (const result of results) {
        expect(result.input_message_content.message_text).toStartWith(
          '<blockquote>chars</blockquote>\n',
        );
      }
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    // No closer, so the apostrophe is not read as an opener — `2d6 don` would not parse
    test('should fall back to presets for an unquoted apostrophe', async () => {
      const results = await bot.sendInline("2d6 don't");
      expectArticles(results, [ASK_ARTICLE, ...PRESET_ARTICLES]);
      expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
    });

    test('should fall back to presets when the notation is invalid', async () => {
      const results = await bot.sendInline('xyz "label"');
      expectArticles(results, [ASK_ARTICLE, ...PRESET_ARTICLES]);
      expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
      // The presets carry no label; only the ask article quotes anything
      for (const result of results.slice(1)) {
        expect(result.input_message_content.message_text).not.toContain('<blockquote>');
      }
    });

    test('should escape HTML in the label', async () => {
      const results = await bot.sendInline('d20 "<b>x</b>"');
      expect(results[0].input_message_content.message_text).toStartWith(
        '<blockquote>&lt;b&gt;x&lt;/b&gt;</blockquote>\n',
      );
    });
  });

  test('should fall back to presets with help button above the dice limit', async () => {
    const results = await bot.sendInline('999d6');
    expectArticles(results, [ASK_ARTICLE, ...PRESET_ARTICLES]);
    expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
  });

  describe('Ask article', () => {
    function titles(results: any[]): string[] {
      return results.map((result) => result.title);
    }

    function askText(results: any[]): string {
      return results.find((result) => result.title === ASK_ARTICLE.title).input_message_content
        .message_text;
    }

    // Nothing typed yet, and a lone `d` is notation on its way in
    test('should be absent until something is asked', async () => {
      for (const query of ['', '   ', 'd']) {
        expect(titles(await bot.sendInline(query))).not.toContain(ASK_ARTICLE.title);
      }
    });

    test('should be absent for notation that names a die', async () => {
      for (const query of ['d20', '2d20+5', '4dF', 'd%', '4d6kh3', '2d6 "Attack"']) {
        expect(titles(await bot.sendInline(query))).not.toContain(ASK_ARTICLE.title);
      }
    });

    // `2024` rolls a d2024 and `1 2` a 1d2, but neither is a die anyone named
    test('should trail the roll for bare-number shorthand', async () => {
      for (const query of ['2024', '1 2', '2 10 -1']) {
        expect(titles(await bot.sendInline(query))).toEqual(['Roll', 'Full', ASK_ARTICLE.title]);
      }
    });

    test('should lead for text that is not notation', async () => {
      for (const query of ['will it rain tomorrow', '去', '?', 'should I text her']) {
        expect(titles(await bot.sendInline(query))[0]).toEqual(ASK_ARTICLE.title);
      }
    });

    // A `d` inside a word must not read as a die: "Should" carries one
    test('should lead for a quoted question, which parses as a labelled d20', async () => {
      for (const query of ['"Should I text her?"', '«Стоит ли?»', '“Should we?”']) {
        const results = await bot.sendInline(query);
        expect(titles(results)).toEqual([ASK_ARTICLE.title, 'Roll', 'Full']);
      }
    });

    test('should quote the question above a Yes or No', async () => {
      const results = await bot.sendInline('will it rain');
      const [quote, answer] = askText(results).split('\n');
      expect(quote).toEqual('<blockquote>will it rain</blockquote>');
      expect(answer).toMatch(ANSWER);
    });

    test('should answer both ways across many queries', async () => {
      const answers = new Set<string>();
      for (let i = 0; i < 200; i++) {
        answers.add(askText(await bot.sendInline('coin')).split('\n')[1]);
      }
      expect(answers.size).toEqual(2);
    });

    test('should escape HTML in the question', async () => {
      const results = await bot.sendInline('<b>now</b>?');
      expect(askText(results)).toStartWith('<blockquote>&lt;b&gt;now&lt;/b&gt;?</blockquote>\n');
    });

    test('should prefix its id with the ask variant', async () => {
      const results = await bot.sendInline('will it rain');
      expect(results[0].id.split(':')[0]).toEqual('ask');
    });

    test('should localize its title and description', async () => {
      const ru = messages('ru').inline;
      const results = await bot.sendInline('буде дождь', 'ru');
      expect(results[0]).toMatchObject({ title: ru.ask, description: ru.answer });
    });

    test('should leave the help button in place', async () => {
      await bot.sendInline('will it rain');
      expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
    });
  });
});

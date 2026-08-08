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

  test('should return preset articles for invalid query', async () => {
    const results = await bot.sendInline('abc');
    expectArticles(results, PRESET_ARTICLES);
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

  test('should reply with the total alone for the random preset', async () => {
    const results = await bot.sendInline('');
    expect(results[2].input_message_content.message_text).toMatch(/^<b>\d{1,3}<\/b>$/);
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

  test('should fall back to presets with help button above the dice limit', async () => {
    const results = await bot.sendInline('999d6');
    expectArticles(results, PRESET_ARTICLES);
    expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBot } from '../helpers';

let bot: TestBot;

beforeEach(() => {
  bot = new TestBot();
});

const HELP_BUTTON = { text: 'How to use', start_parameter: 'help' };

const PRESET_ARTICLES = [
  { title: 'd20', description: 'd20' },
  { title: 'Random', description: 'd100' },
  { title: 'Advantage', description: '2d20kh1' },
  { title: 'Ability Score', description: '4d6kh3' },
  { title: 'Success Pool', description: '5d10>=6f1' },
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
      { title: 'Roll with breakdown', description: '1d20' },
    ]);
  });

  test('should share one result between compact and detailed articles', async () => {
    const results = await bot.sendInline('d20');
    const compact = results[0].input_message_content.message_text;
    const detailed = results[1].input_message_content.message_text;
    expect(detailed.startsWith(compact)).toBe(true);
  });

  test('should include thumbnail URLs for query articles', async () => {
    const results = await bot.sendInline('d20');
    const base = 'https://raw.githubusercontent.com/edloidas/rollrobot/master/assets';
    expect(results[0].thumbnail_url).toBe(`${base}/d20-icon.png`);
    expect(results[1].thumbnail_url).toBe(`${base}/dnd-icon.png`);
  });

  test('should handle padded notation with whitespace', async () => {
    const results = await bot.sendInline('  11d11 ');
    expectArticles(results, [
      { title: 'Roll', description: '11d11' },
      { title: 'Roll with breakdown', description: '11d11' },
    ]);
  });

  test('should roll extended notation', async () => {
    const results = await bot.sendInline('4d6kh3');
    expectArticles(results, [
      { title: 'Roll', description: '4d6kh3' },
      { title: 'Roll with breakdown', description: '4d6kh3' },
    ]);
  });

  test('should normalize legacy shorthand', async () => {
    const results = await bot.sendInline('2 10 -1');
    expectArticles(results, [
      { title: 'Roll', description: '2d10 - 1' },
      { title: 'Roll with breakdown', description: '2d10 - 1' },
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
  });

  test('should fall back to presets with help button above the dice limit', async () => {
    const results = await bot.sendInline('999d6');
    expectArticles(results, PRESET_ARTICLES);
    expect(bot.inlineResults[0].button).toEqual(HELP_BUTTON);
  });
});

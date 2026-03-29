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
  test('should use personal caching', async () => {
    await bot.sendInline('');
    const payload = bot.inlineResults[0];
    expect(payload.is_personal).toBe(true);
    expect(payload.cache_time).toBe(0);
  });

  test('should include thumbnail URLs for all articles', async () => {
    const results = await bot.sendInline('d20');
    const base = 'https://raw.githubusercontent.com/edloidas/rollrobot/master/assets';
    expect(results[0].thumbnail_url).toBe(`${base}/dnd-icon.png`);
    expect(results[1].thumbnail_url).toBe(`${base}/wod-icon.png`);
    expect(results[2].thumbnail_url).toBe(`${base}/d20-icon.png`);
  });

  test('should return default articles for empty query', async () => {
    const results = await bot.sendInline('');
    expectArticles(results, [
      { title: 'Classic', description: 'd20' },
      { title: 'World of Darkness', description: 'd10>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should return default articles for whitespace-only query', async () => {
    const results = await bot.sendInline('    ');
    expectArticles(results, [
      { title: 'Classic', description: 'd20' },
      { title: 'World of Darkness', description: 'd10>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should return default articles for bare "d" query', async () => {
    const results = await bot.sendInline('d');
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

  test('should return Classic and Random for number-only notation', async () => {
    const results = await bot.sendInline('10');
    expectArticles(results, [
      { title: 'Classic', description: 'd10' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should return matching articles for valid notation', async () => {
    const results = await bot.sendInline('d20');
    expectArticles(results, [
      { title: 'Classic', description: 'd20' },
      { title: 'World of Darkness', description: 'd20>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should handle padded notation with whitespace', async () => {
    const results = await bot.sendInline('  11d11 ');
    expectArticles(results, [
      { title: 'Classic', description: '11d11' },
      { title: 'World of Darkness', description: '11d11>6' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  test('should return WoD and Random for WoD-only notation', async () => {
    const results = await bot.sendInline('4d10>5');
    expectArticles(results, [
      { title: 'World of Darkness', description: '4d10>5' },
      { title: 'Random', description: 'd100' },
    ]);
  });

  describe('Inline help button', () => {
    const expectedButton = { text: 'How to use', start_parameter: 'help' };

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
      expect(bot.inlineResults[0].button).toEqual(expectedButton);
    });

    test('should not show help button for valid classic notation', async () => {
      await bot.sendInline('d20');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should not show help button for valid WoD notation', async () => {
      await bot.sendInline('4d10>5');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });

    test('should not show help button for number-only notation', async () => {
      await bot.sendInline('10');
      expect(bot.inlineResults[0].button).toBeUndefined();
    });
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

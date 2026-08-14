import { describe, expect, test } from 'bun:test';
import { splitOptions } from '../src/options';

/** Options only — the shorthand most cases assert on. */
function opts(input: string): string[] {
  return splitOptions(input).options;
}

describe('splitOptions', () => {
  describe('separator priority', () => {
    test('should split on newline ahead of every other separator', () => {
      expect(opts('Rock | Paper\nScissors, knife\nBow')).toEqual([
        'Rock | Paper',
        'Scissors, knife',
        'Bow',
      ]);
    });

    test('should split on pipe ahead of comma and space', () => {
      expect(opts('a, b | c d')).toEqual(['a, b', 'c d']);
    });

    test('should split on comma ahead of space', () => {
      expect(opts('a b, c d')).toEqual(['a b', 'c d']);
    });

    test('should fall back to space', () => {
      expect(opts('north south east west')).toEqual(['north', 'south', 'east', 'west']);
    });

    test('should treat semicolon as a pipe-tier separator', () => {
      expect(opts('a, b; c')).toEqual(['a, b', 'c']);
    });

    test('should treat the Persian comma as a comma-tier separator', () => {
      expect(opts('سیب، پرتقال، موز')).toEqual(['سیب', 'پرتقال', 'موز']);
    });

    test('should treat the Persian semicolon as a pipe-tier separator', () => {
      expect(opts('a، b؛ c')).toEqual(['a، b', 'c']);
    });

    test('should mix separators within a tier', () => {
      expect(opts('a | b; c')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('tier reporting', () => {
    test('should report which tier did the splitting', () => {
      expect(splitOptions('a\nb').tier).toEqual('newline');
      expect(splitOptions('a | b').tier).toEqual('explicit');
      expect(splitOptions('a, b').tier).toEqual('comma');
      expect(splitOptions('a b').tier).toEqual('space');
    });

    test('should report no tier when there is nothing to split', () => {
      expect(splitOptions('').tier).toBeNull();
      expect(splitOptions('solo').tier).toBeNull();
    });
  });

  describe('cleanup', () => {
    test('should trim each option', () => {
      expect(opts('  a  |  b  ')).toEqual(['a', 'b']);
    });

    test('should drop empty options', () => {
      expect(opts('a || b')).toEqual(['a', 'b']);
      expect(opts('a ,, b')).toEqual(['a', 'b']);
      expect(opts('a | b |')).toEqual(['a', 'b']);
    });

    test('should yield nothing for separators alone', () => {
      expect(opts('|||')).toEqual([]);
      expect(opts(',,,')).toEqual([]);
      expect(opts('   ')).toEqual([]);
      expect(opts('')).toEqual([]);
    });

    test('should keep duplicates so they act as weights', () => {
      expect(opts('hit | hit | miss')).toEqual(['hit', 'hit', 'miss']);
    });

    // grammY trims only the leading side of a command argument
    test('should trim trailing whitespace and newlines off the input', () => {
      expect(opts('a | b  \n\n')).toEqual(['a', 'b']);
    });

    test('should return a lone option unsplit', () => {
      expect(opts('Scissors')).toEqual(['Scissors']);
    });

    // The DMG names items in inverted form, which is why the pipe tier exists
    test('should keep a comma inside an option when a pipe is present', () => {
      expect(opts('Potion of Healing, Greater | Armor, +1 Chain Mail')).toEqual([
        'Potion of Healing, Greater',
        'Armor, +1 Chain Mail',
      ]);
    });
  });

  describe('bullet markers', () => {
    test('should strip list markers from a pasted table', () => {
      expect(opts('- Goblin ambush\n- Merchant caravan\n- Nothing happens')).toEqual([
        'Goblin ambush',
        'Merchant caravan',
        'Nothing happens',
      ]);
    });

    test('should strip numbered and bulleted markers', () => {
      expect(opts('1. Goblin\n2) Orc\n• Troll\n* Ogre')).toEqual([
        'Goblin',
        'Orc',
        'Troll',
        'Ogre',
      ]);
    });

    test('should not strip a marker that is part of the option', () => {
      expect(opts('-5 penalty\n-10 penalty')).toEqual(['-5 penalty', '-10 penalty']);
    });

    test('should only strip markers on the newline tier', () => {
      expect(opts('- a | - b')).toEqual(['- a', '- b']);
    });
  });

  describe('label extraction', () => {
    test('should split a trailing quoted label off the options', () => {
      expect(splitOptions('Rock | Paper "coin flip"')).toMatchObject({
        options: ['Rock', 'Paper'],
        label: 'coin flip',
      });
    });

    test('should accept typographic quote pairs', () => {
      expect(splitOptions('red | green “pick a colour”').label).toEqual('pick a colour');
      expect(splitOptions('red | green «выбери цвет»').label).toEqual('выбери цвет');
      expect(splitOptions('red | green `which`').label).toEqual('which');
    });

    test('should carry the label through every tier', () => {
      expect(splitOptions('a\nb "why"').label).toEqual('why');
      expect(splitOptions('a, b "why"').label).toEqual('why');
      expect(splitOptions('a b "why"').label).toEqual('why');
    });

    test('should report no label when none was given', () => {
      expect(splitOptions('Rock | Paper').label).toBeNull();
    });

    // ! The regression set: an ungated reuse of `extractLabel`'s candidates eats an option
    describe('must never eat an option', () => {
      const KEEP_ALL: [string, string[]][] = [
        ['Rock | "Paper"', ['Rock', '"Paper"']],
        ['"Rock" | "Paper"', ['"Rock"', '"Paper"']],
        ['Rock | Paper | «Ножницы»', ['Rock', 'Paper', '«Ножницы»']],
        [
          '"The Fool" | "The Magician" | "The Empress"',
          ['"The Fool"', '"The Magician"', '"The Empress"'],
        ],
        ["boys' | girls'", ["boys'", "girls'"]],
        ["don't | can't", ["don't", "can't"]],
        ['a | "b c', ['a', '"b c']],
        ["Halo | Assassin's Creed", ['Halo', "Assassin's Creed"]],
        ['L’Aja | Roma', ['L’Aja', 'Roma']],
      ];

      for (const [input, expected] of KEEP_ALL) {
        test(`should keep every option in ${input}`, () => {
          expect(splitOptions(input)).toMatchObject({ options: expected, label: null });
        });
      }
    });

    // Quoting is how people try to hold a phrase together; the last one must stay an option
    test('should not take a label off quoted options on the space tier', () => {
      expect(splitOptions('"Alpha" "Beta"')).toMatchObject({
        options: ['"Alpha"', '"Beta"'],
        label: null,
      });
      expect(splitOptions('«Камень» «Ножницы» «Бумага»')).toMatchObject({
        options: ['«Камень»', '«Ножницы»', '«Бумага»'],
        label: null,
      });
    });

    // `extractLabel` keeps nested quotes intact for rolls; this must not do the opposite
    test('should keep nested quotes out of the label', () => {
      expect(splitOptions('a, b "he said "hi""')).toMatchObject({
        options: ['a', 'b "he said "hi""'],
        label: null,
      });
    });

    test('should not take a label when the whole input is quoted', () => {
      expect(splitOptions('"just this"')).toMatchObject({
        options: ['"just this"'],
        label: null,
      });
    });

    test('should require whitespace before the opening quote', () => {
      expect(splitOptions('a | b"c"').label).toBeNull();
    });

    test('should cap an overlong label', () => {
      expect(splitOptions(`a | b "${'x'.repeat(400)}"`).label).toEqual(`${'x'.repeat(99)}…`);
    });

    test('should treat an empty label as none', () => {
      expect(splitOptions('a | b ""')).toMatchObject({ options: ['a', 'b'], label: null });
    });
  });
});

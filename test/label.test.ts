import { describe, test, expect } from 'bun:test';
import { withLabel } from '../src/format';
import { extractLabel } from '../src/label';

describe('extractLabel', () => {
  test('splits a straight-quoted label off the end', () => {
    expect(extractLabel('2d20+1 "My message"')).toEqual({
      notation: '2d20+1',
      label: 'My message',
    });
    expect(extractLabel("4d6 'characteristics'")).toEqual({
      notation: '4d6',
      label: 'characteristics',
    });
    expect(extractLabel('d20 `attack`')).toEqual({ notation: 'd20', label: 'attack' });
  });

  // Mobile keyboards substitute these by locale
  test('accepts typographic pairs and guillemets', () => {
    expect(extractLabel('2d6 “attack”')).toEqual({ notation: '2d6', label: 'attack' });
    expect(extractLabel('2d6 „Angriff“')).toEqual({ notation: '2d6', label: 'Angriff' });
    expect(extractLabel('2d6 ‘attack’')).toEqual({ notation: '2d6', label: 'attack' });
    expect(extractLabel('2d6 ‚Angriff‘')).toEqual({ notation: '2d6', label: 'Angriff' });
    expect(extractLabel('2d6 «атака»')).toEqual({ notation: '2d6', label: 'атака' });
    expect(extractLabel('2d6 ‹attack›')).toEqual({ notation: '2d6', label: 'attack' });
  });

  // Swiss and reversed-guillemet layouts turn the pair around
  test('accepts reversed guillemet pairs', () => {
    expect(extractLabel('2d6 »Angriff«')).toEqual({ notation: '2d6', label: 'Angriff' });
    expect(extractLabel('2d6 ›attack‹')).toEqual({ notation: '2d6', label: 'attack' });
  });

  // Some keyboards emit the closing glyph on both sides
  test('accepts a typographic mark used as its own opener', () => {
    expect(extractLabel('2d6 ”attack”')).toEqual({ notation: '2d6', label: 'attack' });
    expect(extractLabel('2d6 ’attack’')).toEqual({ notation: '2d6', label: 'attack' });
    expect(extractLabel('2d6 «атака«')).toEqual({ notation: '2d6', label: 'атака' });
  });

  test('leaves input without a trailing quote alone', () => {
    expect(extractLabel('4d6kh3')).toEqual({ notation: '4d6kh3', label: null });
    expect(extractLabel('  2 10 -1  ')).toEqual({ notation: '2 10 -1', label: null });
    expect(extractLabel('')).toEqual({ notation: '', label: null });
  });

  test('accepts an unterminated opening quote', () => {
    expect(extractLabel('4d6 "chars')).toEqual({ notation: '4d6', label: 'chars' });
    expect(extractLabel('d2 “Customers wear Chockers')).toEqual({
      notation: 'd2',
      label: 'Customers wear Chockers',
    });
    expect(extractLabel('2d6 «атака')).toEqual({ notation: '2d6', label: 'атака' });
  });

  test('drops a quote left with nothing to open', () => {
    expect(extractLabel('4d6 "')).toEqual({ notation: '4d6', label: null });
    expect(extractLabel('"')).toEqual({ notation: '', label: null });
  });

  // Without a closer, only a quote after a space reads as an opener — otherwise
  // `2d6 s'more` would split into the sort modifier `2d6 s` labelled `more`
  test('leaves a mid-word apostrophe in the notation', () => {
    expect(extractLabel("2d6 s'more")).toEqual({ notation: "2d6 s'more", label: null });
    expect(extractLabel("2d6 don't")).toEqual({ notation: "2d6 don't", label: null });
  });

  // The mis-split `d20 it` / `s a trap` used to reach the parser and error there
  test('leaves input whole when no split parses', () => {
    expect(extractLabel("d20 it's a trap'")).toEqual({ notation: "d20 it's a trap'", label: null });
  });

  // Two keyboards, two quote families — the closer does not accept this opener,
  // so the split only happens because the unterminated candidate is tried next
  test('splits a mismatched quote pair', () => {
    expect(extractLabel('2d6 ‘attack”')).toEqual({ notation: '2d6', label: 'attack”' });
  });

  test('reports a label with no notation', () => {
    expect(extractLabel('"attack"')).toEqual({ notation: '', label: 'attack' });
  });

  test('drops an empty or whitespace-only label', () => {
    expect(extractLabel('2d6 ""')).toEqual({ notation: '2d6', label: null });
    expect(extractLabel('2d6 "   "')).toEqual({ notation: '2d6', label: null });
  });

  // The first quote necessarily opens the label — no quote is valid notation
  test('keeps nested quotes inside the label', () => {
    expect(extractLabel('2d6 "he said "hi""')).toEqual({
      notation: '2d6',
      label: 'he said "hi"',
    });
  });

  test('leaves eastern numerals in the label alone', () => {
    expect(extractLabel('2d6 «ضربهٔ ۳»')).toEqual({ notation: '2d6', label: 'ضربهٔ ۳' });
  });

  test('trims whitespace around both halves', () => {
    expect(extractLabel('  2d6   "  spaced  "  ')).toEqual({ notation: '2d6', label: 'spaced' });
  });

  test('caps an overlong label and marks the cut', () => {
    const { label } = extractLabel(`2d6 "${'x'.repeat(500)}"`);
    expect([...label]).toHaveLength(100);
    expect(label).toEndWith('…');
  });

  // Slicing UTF-16 code units would leave an unpaired surrogate here
  test('caps on code points, never mid-character', () => {
    const { label } = extractLabel(`2d6 "${'🎲'.repeat(150)}"`);
    expect([...label]).toHaveLength(100);
    expect(label).toBe(`${'🎲'.repeat(99)}…`);
  });

  // ! The only thing keeping a labelled reply under Telegram's 4096-character limit.
  //   `formatDetailedResult` caps the body at 3500, and escaping expands `&` fivefold.
  test('leaves a worst-case labelled reply inside the Telegram limit', () => {
    const { label } = extractLabel(`2d6 "${'&'.repeat(500)}"`);
    expect(withLabel('x'.repeat(3500), label).length).toBeLessThanOrEqual(4096);
  });
});

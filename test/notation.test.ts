import { describe, test, expect } from 'bun:test';
import { normalizeNotation } from '../src/notation';

describe('normalizeNotation', () => {
  test('defaults empty input to d20', () => {
    expect(normalizeNotation('')).toBe('d20');
    expect(normalizeNotation('   ')).toBe('d20');
  });

  test('treats a bare number as a die size', () => {
    expect(normalizeNotation('20')).toBe('d20');
    expect(normalizeNotation('100')).toBe('d100');
  });

  test('rewrites the simplified space-separated form', () => {
    expect(normalizeNotation('2 10')).toBe('2d10');
    expect(normalizeNotation('2 10 -1')).toBe('2d10-1');
    expect(normalizeNotation('2 10 +3')).toBe('2d10+3');
    expect(normalizeNotation('2 10 3')).toBe('2d10+3');
  });

  // Persian and Arabic keyboards emit their own numerals, which the ASCII-only
  // parser grammar and the shorthand rules above would otherwise reject
  test('folds eastern numerals to ASCII', () => {
    expect(normalizeNotation('۲۰')).toBe('d20');
    expect(normalizeNotation('٢٠')).toBe('d20');
    expect(normalizeNotation('۲ ۱۰ -۱')).toBe('2d10-1');
    expect(normalizeNotation('٢ ١٠ -١')).toBe('2d10-1');
    expect(normalizeNotation('۲d۲۰+۵')).toBe('2d20+5');
    expect(normalizeNotation('۴d۶kh۳')).toBe('4d6kh3');
  });

  test('folds every digit in both eastern ranges', () => {
    expect(normalizeNotation('d۰۱۲۳۴۵۶۷۸۹')).toBe('d0123456789');
    expect(normalizeNotation('d٠١٢٣٤٥٦٧٨٩')).toBe('d0123456789');
  });

  // Shift+5 on the standard Persian layout, so `d٪` is what a percentile roll looks like
  test('folds the arabic percent sign', () => {
    expect(normalizeNotation('d٪')).toBe('d%');
  });

  test('passes dice notation through untouched', () => {
    expect(normalizeNotation('d20')).toBe('d20');
    expect(normalizeNotation('4d6kh3')).toBe('4d6kh3');
    expect(normalizeNotation(' 2d20kh1+7 ')).toBe('2d20kh1+7');
    expect(normalizeNotation('1d20+7 vs 15')).toBe('1d20+7 vs 15');
  });
});

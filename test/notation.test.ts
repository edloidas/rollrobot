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

  test('passes dice notation through untouched', () => {
    expect(normalizeNotation('d20')).toBe('d20');
    expect(normalizeNotation('4d6kh3')).toBe('4d6kh3');
    expect(normalizeNotation(' 2d20kh1+7 ')).toBe('2d20kh1+7');
    expect(normalizeNotation('1d20+7 vs 15')).toBe('1d20+7 vs 15');
  });
});

import { describe, expect, test } from 'bun:test';
import { classify } from '../../scripts/analytics/systems';

function id(term: string, modifiers = '') {
  return classify(term, modifiers).id;
}

describe('classify', () => {
  test('reads Fate dice off the die alone', () => {
    expect(classify('4dF', '')).toMatchObject({ id: 'fate', confidence: 'strong' });
  });

  test('separates a d20 against a DC from an opposed roll', () => {
    expect(id('1d20', 'vs')).toBe('d20-vs-dc');
    expect(id('2d6', 'vs')).toBe('opposed');
  });

  test('recognizes the ability score array shape', () => {
    expect(id('4d6', 'kh')).toBe('stat-array');
    expect(id('4d6', 'dl')).toBe('stat-array');
  });

  test('does not read a stat array from a different pool size', () => {
    expect(id('3d6', 'kh')).toBe('keep-drop');
    expect(id('4d8', 'kh')).toBe('keep-drop');
  });

  test('reads advantage from keep/drop on a d20', () => {
    expect(id('2d20', 'kh')).toBe('d20-advantage');
    expect(id('2d20', 'kl')).toBe('d20-advantage');
  });

  test('prefers the exploding pool over the plain success pool on d10', () => {
    expect(id('5d10', '!')).toBe('pool-exploding');
    expect(id('5d10', '>=')).toBe('pool-d10');
  });

  test('requires several dice before calling something a pool', () => {
    expect(id('1d10', '>=')).toBe('success-count');
    expect(id('2d6', '>=')).toBe('success-count');
    expect(id('3d6', '>=')).toBe('pool-d6');
  });

  test('falls back to the modifier when no pool shape matches', () => {
    expect(id('1d8', 'r')).toBe('reroll');
    expect(id('1d8', 'ro')).toBe('reroll');
    expect(id('1d8', 'min')).toBe('bounded');
    expect(id('1d8', 'sa')).toBe('sorted');
    expect(id('1d8', 'cs')).toBe('crit-threshold');
  });

  test('reads the leftmost token of a compound modifier list by rule order', () => {
    expect(id('1d20', 'kh,r')).toBe('d20-advantage');
    expect(id('1d8', 'r,!')).toBe('exploding');
  });

  test('marks unmodified shapes as weak', () => {
    expect(classify('1d100', '')).toMatchObject({ id: 'percentile', confidence: 'weak' });
    expect(classify('1d20', '')).toMatchObject({ id: 'd20', confidence: 'weak' });
    expect(classify('2d6', '')).toMatchObject({ id: 'plain', confidence: 'weak' });
  });

  test('does not throw on a shape the writer should never emit', () => {
    expect(id('nonsense')).toBe('unparsed');
    expect(id('')).toBe('unparsed');
  });
});

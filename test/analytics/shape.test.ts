import { describe, expect, test } from 'bun:test';
import { roll } from 'roll-parser';
import { shapeTerms } from '../../src/analytics/shape';
import { ROLL_LIMITS } from '../../src/limits';

function shape(notation: string) {
  return shapeTerms(roll(notation, ROLL_LIMITS));
}

function summarize(notation: string) {
  return shape(notation).map(({ index, term, bucket, modifiers }) => ({
    index,
    term,
    bucket,
    modifiers,
  }));
}

describe('shapeTerms', () => {
  test('emits a single term for a bare die', () => {
    expect(summarize('d20')).toEqual([{ index: 0, term: '1d20', bucket: 'd20', modifiers: '' }]);
  });

  test('drops numeric constants', () => {
    expect(summarize('d20+1')).toEqual(summarize('d20'));
  });

  test('records keep/drop without its count', () => {
    expect(summarize('4d6kh3')).toEqual([{ index: 0, term: '4d6', bucket: 'd6', modifiers: 'kh' }]);
    expect(summarize('4d6kh1')).toEqual(summarize('4d6kh3'));
  });

  test('records the explode variant', () => {
    expect(summarize('3d6!')).toEqual([{ index: 0, term: '3d6', bucket: 'd6', modifiers: '!' }]);
    expect(shape('3d6!!')[0].modifiers).toBe('!!');
    expect(shape('3d6!p')[0].modifiers).toBe('!p');
  });

  test('records the success-count operator', () => {
    expect(summarize('2d10>=7')).toEqual([
      { index: 0, term: '2d10', bucket: 'd10', modifiers: '>=' },
    ]);
  });

  test('buckets Fate dice as dF', () => {
    expect(summarize('4dF')).toEqual([{ index: 0, term: '4dF', bucket: 'dF', modifiers: '' }]);
  });

  test('buckets non-standard sides as other', () => {
    expect(summarize('1d999999')).toEqual([
      { index: 0, term: '1d999999', bucket: 'other', modifiers: '' },
    ]);
    expect(shape('1d7')[0].bucket).toBe('other');
  });

  test('emits one term per distinct die, indexed left to right', () => {
    expect(summarize('1d20+2d6')).toEqual([
      { index: 0, term: '1d20', bucket: 'd20', modifiers: '' },
      { index: 1, term: '2d6', bucket: 'd6', modifiers: '' },
    ]);
  });

  test('dedupes identical terms to their first occurrence', () => {
    expect(summarize('2d6+2d6')).toEqual([{ index: 0, term: '2d6', bucket: 'd6', modifiers: '' }]);
  });

  test('keeps identical dice apart when their modifiers differ', () => {
    expect(summarize('{4d6kh3, 4d6}')).toEqual([
      { index: 0, term: '4d6', bucket: 'd6', modifiers: 'kh' },
      { index: 1, term: '4d6', bucket: 'd6', modifiers: '' },
    ]);
  });

  test('attributes modifiers from the whole root-to-leaf path', () => {
    expect(shape('4d6kh3!')[0].modifiers).toBe('!,kh');
  });

  test('flattens a chained keep/drop into one term', () => {
    expect(shape('5d6kh4dl1')[0].modifiers).toBe('kh,dl');
  });

  test('caps at 20 terms', () => {
    const notation = Array.from({ length: 25 }, (_, index) => `1d${index + 1}`).join('+');
    const terms = shape(notation);

    expect(terms).toHaveLength(20);
    expect(terms.at(-1)?.term).toBe('1d20');
  });

  test('emits nothing for an expression with no dice', () => {
    expect(shape('1+1')).toEqual([]);
  });

  test('is never reached for notation that throws — evaluation fails first', () => {
    expect(() => roll('not-notation', ROLL_LIMITS)).toThrow();
    expect(() => roll('999d6', ROLL_LIMITS)).toThrow();
  });

  test('propagates errors from a malformed result for the caller to isolate', () => {
    expect(() => shapeTerms({ parts: null } as never)).toThrow();
  });

  test('records the resolved count of a meta expression', () => {
    const result = roll('(1d4)d6', ROLL_LIMITS);
    const [term] = shapeTerms(result);

    expect(term.term).toBe(
      `${result.rolls.filter((die) => !die.modifiers.includes('meta')).length}d6`,
    );
  });
});

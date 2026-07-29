import { describe, test, expect } from 'bun:test';
import { isRollParserError, roll, type RollParserError } from 'roll-parser';
import { createMockRng } from 'roll-parser/testing';
import { escapeHtml, formatDetailedResult, formatError, formatResult } from '../src/format';

function rollError(notation: string): RollParserError {
  try {
    roll(notation);
  } catch (error) {
    if (isRollParserError(error)) return error;
  }
  throw new Error(`Expected ${notation} to fail`);
}

describe('escapeHtml', () => {
  test('escapes HTML-significant characters', () => {
    expect(escapeHtml('10d10>=6 & <3')).toBe('10d10&gt;=6 &amp; &lt;3');
  });
});

describe('formatResult', () => {
  test('formats a plain total', () => {
    const result = roll('3d6', { rng: createMockRng([4, 2, 6]) });
    expect(formatResult(result)).toBe('<code>3d6</code> = <b>12</b>');
  });

  test('normalizes the expression', () => {
    const result = roll('d20+5', { rng: createMockRng([11]) });
    expect(formatResult(result)).toBe('<code>1d20 + 5</code> = <b>16</b>');
  });

  test('leads with counts for success pools', () => {
    const result = roll('5d10>=6f1', { rng: createMockRng([10, 2, 6, 1, 7]) });
    expect(formatResult(result)).toBe(
      '<code>5d10&gt;=6f1</code> = <b>3</b> successes, <b>1</b> failure',
    );
  });

  test('uses singular forms for single counts', () => {
    const result = roll('3d10>=6', { rng: createMockRng([7, 2, 3]) });
    expect(formatResult(result)).toBe('<code>3d10&gt;=6</code> = <b>1</b> success');
  });

  test('omits zero failures', () => {
    const result = roll('3d10>=6f1', { rng: createMockRng([7, 8, 3]) });
    expect(formatResult(result)).toBe('<code>3d10&gt;=6f1</code> = <b>2</b> successes');
  });

  test('shows degree of success with the natural roll', () => {
    const result = roll('1d20+7 vs 15', { rng: createMockRng([12]) });
    expect(formatResult(result)).toBe('<code>1d20 + 7 vs 15</code> = <b>Success</b> (natural 12)');
  });

  test('upgrades a natural 20 to a critical success', () => {
    const result = roll('1d20+7 vs 15', { rng: createMockRng([20]) });
    expect(formatResult(result)).toBe(
      '<code>1d20 + 7 vs 15</code> = <b>Critical Success</b> (natural 20)',
    );
  });
});

describe('formatDetailedResult', () => {
  test('appends the die breakdown', () => {
    const result = roll('3d6', { rng: createMockRng([4, 2, 6]) });
    expect(formatDetailedResult(result)).toBe('<code>3d6</code> = <b>12</b>\n3d6[4, 2, 6]');
  });

  test('strikes through dropped dice', () => {
    const result = roll('4d6kh3', { rng: createMockRng([3, 6, 2, 5]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>4d6kh3</code> = <b>14</b>\n4d6[3, 6, <s>2</s>, 5]',
    );
  });

  test('bolds successes and underlines failures in pools', () => {
    const result = roll('5d10>=6f1', { rng: createMockRng([10, 2, 6, 1, 7]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>5d10&gt;=6f1</code> = <b>3</b> successes, <b>1</b> failure\n' +
        '5d10&gt;=6f1[<b>10</b>, 2, <b>6</b>, <u>1</u>, <b>7</b>]',
    );
  });
});

describe('formatError', () => {
  test('marks the offending character', () => {
    const message = formatError(rollError('2d6+&'), '2d6+&');
    expect(message).toMatch(/^<i>.+\.<\/i>\n<pre>2d6\+&amp;\n {4}\^<\/pre>$/);
  });

  test('marks evaluator error spans', () => {
    const message = formatError(rollError('2d6+1d0'), '2d6+1d0');
    expect(message).toMatch(/^<i>.+\.<\/i>\n<pre>2d6\+1d0\n {4}\^{3}<\/pre>$/);
  });

  test('skips the caret line when the error has no usable span', () => {
    const message = formatError(rollError('6d'), '6d');
    expect(message).toMatch(/^<i>.+\.<\/i>\n<pre>6d<\/pre>$/);
  });

  test('skips the notation echo for multiline input', () => {
    const message = formatError(rollError('2d6+\n&'), '2d6+\n&');
    expect(message).toMatch(/^<i>.+\.<\/i>$/);
  });
});

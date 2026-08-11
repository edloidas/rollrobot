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
    expect(formatDetailedResult(result)).toBe('<code>3d6</code> = <b>12</b>\n[4, 2, 6↑]');
  });

  test('strikes through dropped dice', () => {
    const result = roll('4d6kh3', { rng: createMockRng([3, 6, 2, 5]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>4d6kh3</code> = <b>14</b>\n[3, 6↑, <s>2</s>, 5]',
    );
  });

  test('bolds successes and underlines failures in pools', () => {
    const result = roll('5d10>=6f1', { rng: createMockRng([10, 2, 6, 1, 7]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>5d10&gt;=6f1</code> = <b>3</b> successes, <b>1</b> failure\n' +
        '[<b>10↑</b>, 2, <b>6</b>, <u>1↓</u>, <b>7</b>]',
    );
  });

  test('keeps arithmetic around the rolled values', () => {
    const result = roll('2d10-1', { rng: createMockRng([7, 6]) });
    expect(formatDetailedResult(result)).toBe('<code>2d10 - 1</code> = <b>12</b>\n[7, 6] - 1');
  });

  test('strips the notation of every dice group', () => {
    const result = roll('2d6+1d4', { rng: createMockRng([6, 1, 3]) });
    expect(formatDetailedResult(result)).toBe('<code>2d6 + 1d4</code> = <b>10</b>\n[6, 1] + [3]');
  });

  test('keeps exploded dice attached to their group', () => {
    const result = roll('1d8!', { rng: createMockRng([8, 2]) });
    expect(formatDetailedResult(result)).toBe('<code>1d8!</code> = <b>10</b>\n[8↑, 2]');
  });

  test('marks a natural maximum and a natural 1', () => {
    expect(formatDetailedResult(roll('1d20', { rng: createMockRng([20]) }))).toBe(
      '<code>1d20</code> = <b>20</b>\n[20↑]',
    );
    expect(formatDetailedResult(roll('1d20', { rng: createMockRng([1]) }))).toBe(
      '<code>1d20</code> = <b>1</b>\n[1↓]',
    );
  });

  test('keeps meta dice out of the breakdown', () => {
    const result = roll('(1d4)d6', { rng: createMockRng([2, 6, 3]) });
    expect(formatDetailedResult(result)).toBe('<code>2d6</code> = <b>9</b>\n[6↑, 3]');
  });

  test('leaves multi-pool breakdowns unmarked', () => {
    const result = roll('2d6+1d8', { rng: createMockRng([6, 3, 8]) });
    expect(formatDetailedResult(result)).toBe('<code>2d6 + 1d8</code> = <b>17</b>\n[6, 3] + [8]');
  });

  test('leaves the dice of a versus comparison unmarked', () => {
    const result = roll('1d20 vs 2d10', { rng: createMockRng([18, 5, 10]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>1d20 vs 2d10</code> = <b>Success</b> (natural 18)\n[18] vs [5, 10]',
    );
  });

  test('marks a critical sitting on a success', () => {
    const result = roll('10d20>=10f<=3', {
      rng: createMockRng([20, 9, 3, 16, 8, 15, 8, 13, 13, 14]),
    });
    expect(formatDetailedResult(result)).toBe(
      '<code>10d20&gt;=10f&lt;=3</code> = <b>6</b> successes, <b>1</b> failure\n' +
        '[<b>20↑</b>, 9, <u>3</u>, <b>16</b>, 8, <b>15</b>, 8, <b>13</b>, <b>13</b>, <b>14</b>]',
    );
  });

  test('marks fumbles sitting on failures', () => {
    const result = roll('10d10>=6f1', { rng: createMockRng([8, 4, 6, 5, 1, 5, 10, 9, 1, 9]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>10d10&gt;=6f1</code> = <b>5</b> successes, <b>2</b> failures\n' +
        '[<b>8</b>, 4, <b>6</b>, 5, <u>1↓</u>, 5, <b>10↑</b>, <b>9</b>, <u>1↓</u>, <b>9</b>]',
    );
  });

  test('ignores small dice, whose extremes carry no information', () => {
    expect(formatDetailedResult(roll('6d4', { rng: createMockRng([4, 2, 1, 4, 3, 1]) }))).toBe(
      '<code>6d4</code> = <b>15</b>\n[4, 2, 1, 4, 3, 1]',
    );
    expect(
      formatDetailedResult(roll('10d2', { rng: createMockRng([1, 2, 2, 1, 2, 1, 1, 2, 2, 1]) })),
    ).toBe('<code>10d2</code> = <b>15</b>\n[1, 2, 2, 1, 2, 1, 1, 2, 2, 1]');
  });

  test('marks a small-dice pool once a threshold is declared', () => {
    const result = roll('10d2cf', { rng: createMockRng([1, 2, 2, 1, 2, 1, 1, 2, 2, 1]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>10d2cf</code> = <b>15</b>\n[1↓, 2, 2, 1↓, 2, 1↓, 1↓, 2, 2, 1↓]',
    );
  });

  test('marks small dice for the extreme the notation declares', () => {
    const faces = [4, 2, 1, 4, 3, 1];
    expect(formatDetailedResult(roll('6d4cf', { rng: createMockRng(faces) }))).toBe(
      '<code>6d4cf</code> = <b>15</b>\n[4, 2, 1↓, 4, 3, 1↓]',
    );
    expect(formatDetailedResult(roll('6d4cs', { rng: createMockRng(faces) }))).toBe(
      '<code>6d4cs</code> = <b>15</b>\n[4↑, 2, 1, 4↑, 3, 1]',
    );
  });

  test('honours a custom critical threshold', () => {
    const result = roll('5d20cs>=15', { rng: createMockRng([14, 20, 6, 16, 15]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>5d20cs&gt;=15</code> = <b>71</b>\n[14, 20↑, 6, 16↑, 15↑]',
    );
  });

  test('leaves a compound explosion unmarked', () => {
    const faces = [6, 6, 3];
    expect(formatDetailedResult(roll('1d6!!', { rng: createMockRng(faces) }))).toBe(
      '<code>1d6!!</code> = <b>15</b>\n[15]',
    );
    expect(formatDetailedResult(roll('1d6!!cs', { rng: createMockRng(faces) }))).toBe(
      '<code>1d6!!cs</code> = <b>15</b>\n[15]',
    );
  });

  test('leaves penetrating explosions unmarked past the first die', () => {
    expect(formatDetailedResult(roll('1d20!p', { rng: createMockRng([20, 20, 5]) }))).toBe(
      '<code>1d20!p</code> = <b>43</b>\n[20↑, 19, 4]',
    );
    expect(formatDetailedResult(roll('1d6!p', { rng: createMockRng([6, 1]) }))).toBe(
      '<code>1d6!p</code> = <b>6</b>\n[6↑, 0]',
    );
  });

  test('leaves a struck-through group sub-roll alone', () => {
    expect(formatDetailedResult(roll('{2d6, 5}kl1', { rng: createMockRng([6, 3]) }))).toBe(
      '<code>{2d6, 5}kl1</code> = <b>5</b>\n{<s>[6, 3]</s>, 5}',
    );
    expect(formatDetailedResult(roll('{1d20, 3}kh1', { rng: createMockRng([1]) }))).toBe(
      '<code>{1d20, 3}kh1</code> = <b>3</b>\n{<s>[1]</s>, 3}',
    );
  });

  test('marks the higher extreme when a die is both a critical and a fumble', () => {
    const result = roll('4d20cs>=10cf<=15', { rng: createMockRng([12, 3, 18, 11]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>4d20cs&gt;=10cf&lt;=15</code> = <b>44</b>\n[12↑, 3↓, 18↑, 11↑]',
    );
  });

  test('leaves clamped dice unmarked, since the face rolled is not the one shown', () => {
    expect(formatDetailedResult(roll('2d6min5', { rng: createMockRng([1, 6]) }))).toBe(
      '<code>2d6min5</code> = <b>11</b>\n[5, 6↑]',
    );
    expect(formatDetailedResult(roll('2d6max2', { rng: createMockRng([6, 1]) }))).toBe(
      '<code>2d6max2</code> = <b>3</b>\n[2, 1↓]',
    );
  });

  test('marks each die of a standard explosion on its own face', () => {
    const result = roll('1d6!', { rng: createMockRng([6, 3]) });
    expect(formatDetailedResult(result)).toBe('<code>1d6!</code> = <b>9</b>\n[6↑, 3]');
  });

  test('marks the natural roll of a versus comparison', () => {
    const result = roll('1d20 vs 15', { rng: createMockRng([20]) });
    expect(formatDetailedResult(result)).toBe(
      '<code>1d20 vs 15</code> = <b>Critical Success</b> (natural 20)\n[20↑] vs 15',
    );
  });

  test('marks dice in sorted order', () => {
    const result = roll('4d6s', { rng: createMockRng([3, 6, 1, 5]) });
    expect(formatDetailedResult(result)).toBe('<code>4d6s</code> = <b>15</b>\n[1↓, 3, 5, 6↑]');
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

  // Carets are placed by code-unit offset, which a right-to-left run reorders away from
  test('drops the caret line for right-to-left notation, keeping the echo', () => {
    expect(formatError(rollError('2d20 ضربه'), '2d20 ضربه')).toBe(
      "<i>Unexpected character: 'ض'.</i>\n<pre>2d20 ضربه</pre>",
    );
    expect(formatError(rollError('2d20 בדיקה'), '2d20 בדיקה')).toBe(
      "<i>Unexpected character: 'ב'.</i>\n<pre>2d20 בדיקה</pre>",
    );
  });

  // A tab is not one column wide, so carets under it would land short
  test('drops the caret line for tabs, keeping the echo', () => {
    expect(formatError(rollError('2d6\t&'), '2d6\t&')).toBe(
      "<i>Unexpected character: '&amp;'.</i>\n<pre>2d6\t&amp;</pre>",
    );
  });

  // Cyrillic is single-column and single-code-unit, so offsets still line up. `в` sits on
  // the `d` key, which makes this the likeliest typo a Russian-layout user makes.
  test('keeps the caret line for single-width non-ASCII', () => {
    const message = formatError(rollError('2в20'), '2в20');
    expect(message).toMatch(/^<i>.+\.<\/i>\n<pre>2в20\n \^<\/pre>$/);
  });

  // ! An override reorders the reply without appearing in it, so it is named rather than
  //   echoed — otherwise a roll could display text its sender never wrote.
  test('names bidi controls instead of passing them through', () => {
    const overridden = '2d20\u202Eabc';
    const message = formatError(rollError(overridden), overridden);
    expect(message).toContain('U+202E');
    expect(message).not.toMatch(/\p{Bidi_Control}/u);
  });
});

describe('escapeHtml direction controls', () => {
  test('names every direction control it finds', () => {
    expect(escapeHtml('a‮b‏c⁦d')).toBe('aU+202EbU+200FcU+2066d');
  });

  // Persian orthography depends on ZWNJ, which is not a direction control
  test('leaves ZWNJ and ZWJ alone', () => {
    expect(escapeHtml('می‌اندازد')).toBe('می‌اندازد');
    expect(escapeHtml('a‍b')).toBe('a‍b');
  });
});

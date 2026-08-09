import { describe, expect, test } from 'bun:test';
import {
  barChart,
  compact,
  esc,
  lineChart,
  niceMax,
  percent,
  type SeriesPoint,
  stackedBar,
  trendIsReadable,
} from '../../scripts/analytics/charts';

describe('esc', () => {
  test('neutralizes the characters that would break out of markup', () => {
    expect(esc('<script>"a" & \'b\'</script>')).toBe(
      "&lt;script&gt;&quot;a&quot; &amp; 'b'&lt;/script&gt;",
    );
  });

  test('leaves dice notation alone', () => {
    expect(esc('4d6kh3')).toBe('4d6kh3');
  });
});

describe('compact', () => {
  test('groups thousands below the abbreviation threshold', () => {
    expect(compact(999)).toBe('999');
    expect(compact(1500)).toBe('1,500');
  });

  test('abbreviates once the digits stop being readable', () => {
    expect(compact(12_345)).toBe('12.3K');
    expect(compact(2_000_000)).toBe('2.0M');
  });
});

describe('percent', () => {
  test('defaults to one decimal and rounds down to none on request', () => {
    expect(percent(0.125)).toBe('12.5%');
    expect(percent(0.125, 0)).toBe('13%');
  });
});

describe('niceMax', () => {
  test('rounds an axis top up to something readable', () => {
    expect(niceMax(34)).toBe(40);
    expect(niceMax(250)).toBe(300);
  });

  test('keeps the maximum even, so the mid gridline lands on a whole number', () => {
    // A max of 7 would draw the mid line at 3.5 and label it 4
    for (const value of [1, 3, 7, 34, 250, 1234]) {
      expect(niceMax(value)).toBeGreaterThanOrEqual(value);
      expect(niceMax(value) / 2).toBe(Math.round(niceMax(value) / 2));
    }
  });

  test('never returns zero, which would collapse the scale', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-5)).toBe(1);
  });
});

describe('trendIsReadable', () => {
  const point = (day: string): SeriesPoint => ({ day, value: 1, frozen: false });

  test('withholds a line below three points', () => {
    expect(trendIsReadable([])).toBe(false);
    expect(trendIsReadable([point('2026-01-01'), point('2026-01-02')])).toBe(false);
  });

  test('allows a line once there is a shape to read', () => {
    expect(trendIsReadable(['2026-01-01', '2026-01-02', '2026-01-03'].map(point))).toBe(true);
  });
});

describe('barChart', () => {
  test('says so rather than drawing an empty axis', () => {
    expect(barChart([])).toContain('No rows');
  });

  test('drops a weak row to the de-emphasis gray and keeps the rest accented', () => {
    const svg = barChart([
      { label: 'strong', value: 10, display: '10', strong: true },
      { label: 'weak', value: 5, display: '5', strong: false },
    ]);

    expect(svg).toContain('var(--series-1)');
    expect(svg).toContain('var(--de-emphasis)');
  });

  test('gives every bar a title, so a value is reachable on hover as well as in text', () => {
    expect(barChart([{ label: 'd20', value: 3, display: '3' }])).toContain('<title>d20: 3</title>');
  });

  test('escapes a label rather than letting it close the tag', () => {
    const svg = barChart([{ label: '<b>', value: 1, display: '1' }]);
    expect(svg).toContain('&lt;b&gt;');
    expect(svg).not.toContain('<b>');
  });

  test('draws nothing for a zero, rather than a stub that misstates it', () => {
    const svg = barChart([{ label: 'none', value: 0, display: '0' }]);
    expect(svg).not.toContain('<path');
  });

  test('truncates a label too long for its column, keeping it inside the viewBox', () => {
    const long = 'exploding d10 pool (L5R, Exalted)';
    const svg = barChart([{ label: long, value: 1, display: '1' }], 60);
    const rendered = /<text class="cat"[^>]*>([^<]*)</.exec(svg)?.[1] ?? '';

    expect(rendered).not.toBe(long);
    expect(rendered.endsWith('…')).toBe(true);
    // The full text survives where it cannot collide
    expect(svg).toContain(`<title>${long}: 1</title>`);
  });
});

describe('stackedBar', () => {
  const wide = { label: 'inline', value: 90, share: 0.9, color: 'a', labelClass: 'ink-light' };
  const narrow = { label: 'group', value: 1, share: 0.01, color: 'b', labelClass: 'ink-dark' };

  test('labels a segment inline only when the text fits', () => {
    const svg = stackedBar([wide, narrow]);

    expect(svg).toContain('>90%<');
    expect(svg).not.toContain('>1%<');
  });

  test('keeps the unlabelled segment reachable through its title', () => {
    expect(stackedBar([wide, narrow])).toContain('group: 1 (1.0%)');
  });

  test('carries the ink class chosen for each fill', () => {
    expect(stackedBar([wide])).toContain('on-fill ink-light');
  });

  test('keeps every segment inside the viewBox when several are thinner than the gap', () => {
    const tiny = (label: string, value: number) => ({
      label,
      value,
      share: value / 1000,
      color: 'c',
      labelClass: 'ink-dark',
    });
    const svg = stackedBar([tiny('a', 1), tiny('b', 1), tiny('c', 1), tiny('d', 997)]);

    const ends = [...svg.matchAll(/x="([\d.]+)" y="0" width="([\d.]+)"/g)].map(
      ([, x, width]) => Number(x) + Number(width),
    );

    expect(ends.length).toBe(4);
    expect(Math.max(...ends)).toBeLessThanOrEqual(640);
  });
});

describe('lineChart', () => {
  const points: SeriesPoint[] = [
    { day: '2026-01-01', value: 10, frozen: true },
    { day: '2026-01-02', value: 20, frozen: false },
    { day: '2026-01-03', value: 15, frozen: false },
  ];

  test('draws one 2px line with an area wash beneath it', () => {
    const svg = lineChart(points);

    expect(svg).toContain('stroke-width="2"');
    expect(svg).toContain('fill-opacity="0.1"');
  });

  test('marks a frozen day so a snapshot is distinguishable from a live estimate', () => {
    expect(lineChart(points)).toContain('2026-01-01: 10 (frozen snapshot)');
  });

  test('labels both ends of the axis and neither point between', () => {
    const svg = lineChart(points);

    expect(svg).toContain('>2026-01-01<');
    expect(svg).toContain('>2026-01-03<');
    expect(svg).not.toContain('>2026-01-02<');
  });

  test('drops the end label below its point when the series peaks last', () => {
    // Peaking on the final day pins the point to the top of the plot, where a
    // label placed above it would sit outside the viewBox
    const rising: SeriesPoint[] = [
      { day: '2026-01-01', value: 10, frozen: false },
      { day: '2026-01-02', value: 25, frozen: false },
      { day: '2026-01-03', value: 40, frozen: false },
    ];
    const y = Number(/<text class="val"[^>]*y="([\d.]+)"/.exec(lineChart(rising))?.[1]);

    expect(y).toBeGreaterThan(12);
  });
});

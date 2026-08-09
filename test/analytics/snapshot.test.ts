import { describe, expect, test } from 'bun:test';
import { completeDays, INGEST_BUFFER_DAYS, RETENTION_DAYS } from '../../scripts/analytics/snapshot';

const TODAY = '2026-08-09';

function shift(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
}

// The newest day that may be frozen is the last one before the ingest buffer
const SETTLED = shift(TODAY, -INGEST_BUFFER_DAYS);

describe('completeDays', () => {
  test('freezes days whose stored aggregate can no longer move', () => {
    expect(completeDays(['2026-08-04', '2026-08-05', '2026-08-06'], TODAY)).toEqual([
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
    ]);
  });

  test('holds back days still inside the ingest buffer', () => {
    const observed = [shift(SETTLED, -1), SETTLED, shift(SETTLED, 1), TODAY];
    expect(completeDays(observed, TODAY)).toEqual([shift(SETTLED, -1)]);
  });

  test('never freezes today, which is still accumulating', () => {
    expect(completeDays([TODAY], TODAY)).toEqual([]);
  });

  test('fills a day nobody used, so a gap is not mistaken for a missed capture', () => {
    expect(completeDays(['2026-08-03', '2026-08-06'], TODAY)).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
    ]);
  });

  test('drops the oldest day, which the rolling window cut mid-day', () => {
    const clipped = shift(TODAY, -RETENTION_DAYS);
    const frozen = completeDays([clipped, shift(clipped, 1)], TODAY);

    expect(frozen).not.toContain(clipped);
    expect(frozen[0]).toBe(shift(clipped, 1));
  });

  test('crosses a month boundary without skipping a day', () => {
    expect(completeDays(['2026-07-30'], '2026-08-03')).toEqual(['2026-07-30', '2026-07-31']);
  });

  test('has nothing to freeze when no observed day has settled', () => {
    expect(completeDays([], TODAY)).toEqual([]);
    expect(completeDays([shift(TODAY, -1)], TODAY)).toEqual([]);
  });
});

/**
 * Hand-written SVG marks. No charting library: the whole page has to open from
 * disk with no network, and the four forms used here are a few dozen lines each.
 *
 * Mark specs are fixed — 2px lines, bars capped at 24px with a 4px rounded data
 * end squared at the baseline, markers at r>=4 wearing a 2px surface ring, and
 * hairline solid gridlines one step off the surface.
 */

export const BAR_THICKNESS = 16;
export const ROW_HEIGHT = 26;

/** Separates touching fills — a gap in the surface color, never a stroke. */
const SURFACE_GAP = 2;

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Rounds an axis maximum up to something a reader can hold in their head.
 *
 * ! The step never drops below 2. The mid gridline is drawn at half the maximum
 *   and its label is rounded, so an odd maximum would put the line at 3.5 and
 *   label it 4 — a gridline that lies about where it sits.
 */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.max(2, 10 ** Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

/** Square at the baseline, rounded at the value end — the end that carries meaning. */
function barPath(x: number, y: number, width: number, height: number): string {
  const radius = Math.min(4, Math.max(0, width), height / 2);
  if (width <= radius) return `M${x},${y}h${width}v${height}h${-width}z`;

  return [
    `M${x},${y}`,
    `H${x + width - radius}`,
    `A${radius},${radius} 0 0 1 ${x + width} ${y + radius}`,
    `V${y + height - radius}`,
    `A${radius},${radius} 0 0 1 ${x + width - radius} ${y + height}`,
    `H${x}`,
    'Z',
  ].join(' ');
}

/** Rough advance width at the 12px label size — enough to keep text off the edge. */
const CHAR_WIDTH = 6.2;

/**
 * Category labels are anchored to the right of their column and grow leftward, so
 * an over-long one runs out of the viewBox and over the card. Truncating keeps the
 * chart intact; the full text stays in the hover title and the table twin.
 */
function fit(label: string, budget: number): string {
  const limit = Math.floor(budget / CHAR_WIDTH);
  return label.length <= limit ? label : `${label.slice(0, Math.max(1, limit - 1))}…`;
}

export interface BarRow {
  label: string;
  value: number;
  /** Formatted figure shown at the tip. */
  display: string;
  /** Emphasis: `false` drops the row to the de-emphasis gray. */
  strong?: boolean;
  title?: string;
}

/**
 * Horizontal bars for magnitude across nominal categories — one hue for every
 * bar, because bar length already encodes the value and a ramp would spend the
 * only free channel restating it. `strong: false` is the emphasis exception.
 */
export function barChart(rows: BarRow[], labelWidth = 132): string {
  if (rows.length === 0) return '<p class="empty">No rows in this window.</p>';

  const width = 640;
  const height = rows.length * ROW_HEIGHT;
  const max = Math.max(...rows.map((row) => row.value), 1);
  const trackStart = labelWidth + 8;
  const trackWidth = width - trackStart - 56;

  const marks = rows.map((row, index) => {
    const y = index * ROW_HEIGHT + (ROW_HEIGHT - BAR_THICKNESS) / 2;
    // A zero draws nothing: a 1px stub for "none" is a bar that misstates its value
    const barWidth = row.value === 0 ? 0 : Math.max(1, (row.value / max) * trackWidth);
    const fill = row.strong === false ? 'var(--de-emphasis)' : 'var(--series-1)';

    return [
      `<g><title>${esc(row.title ?? `${row.label}: ${row.display}`)}</title>`,
      `<text class="cat" x="${labelWidth}" y="${y + BAR_THICKNESS / 2}" text-anchor="end" dominant-baseline="central">${esc(fit(row.label, labelWidth))}</text>`,
      barWidth > 0
        ? `<path d="${barPath(trackStart, y, barWidth, BAR_THICKNESS)}" fill="${fill}" />`
        : '',
      `<text class="val" x="${trackStart + barWidth + 8}" y="${y + BAR_THICKNESS / 2}" dominant-baseline="central">${esc(row.display)}</text>`,
      '</g>',
    ].join('');
  });

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" preserveAspectRatio="xMinYMin meet">${marks.join('')}</svg>`;
}

export interface Segment {
  label: string;
  value: number;
  share: number;
  color: string;
  /**
   * Class picking the in-fill label ink. A label sitting on a colored fill is the
   * one place text takes its color from the mark, and it has to be chosen by the
   * fill's luminance — white on the aqua or yellow slot measures under 3:1.
   */
  labelClass: string;
}

/**
 * One stacked bar for part-to-whole. Segments are separated by a gap in the
 * surface color rather than a stroke, and a segment is only labelled inline when
 * the text measurably fits — a clipped label is worse than none, and the value
 * is in the table twin either way.
 */
export function stackedBar(segments: Segment[]): string {
  if (segments.length === 0) return '<p class="empty">No rows in this window.</p>';

  const width = 640;
  const height = 34;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  // ! Positions come from the running total, never from accumulating spans. Adding
  //   a gap per segment walks the last one past the viewBox once several segments
  //   are narrower than the gap itself.
  let consumed = 0;
  const marks = segments.map((segment) => {
    const start = (consumed / total) * width;
    consumed += segment.value;
    const end = (consumed / total) * width;
    const span = Math.max(0, end - start - SURFACE_GAP);

    const label = percent(segment.share, 0);
    // ~7px per char at this size, plus 16px of padding either side
    const fits = span > label.length * 7 + 16;

    return [
      `<g><title>${esc(`${segment.label}: ${compact(segment.value)} (${percent(segment.share)})`)}</title>`,
      `<rect x="${start}" y="0" width="${span}" height="${height}" fill="${segment.color}" rx="2" />`,
      fits
        ? `<text class="on-fill ${segment.labelClass}" x="${start + span / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central">${esc(label)}</text>`
        : '',
      '</g>',
    ].join('');
  });

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" preserveAspectRatio="none" style="height:${height}px">${marks.join('')}</svg>`;
}

export interface SeriesPoint {
  day: string;
  value: number;
  /** Frozen days come from snapshots and outlive the query window. */
  frozen: boolean;
}

/**
 * A single series over time. Two points cannot show a trend, so the caller is
 * expected to withhold this form below three — see `trendIsReadable`.
 */
export function lineChart(points: SeriesPoint[]): string {
  const width = 640;
  const height = 200;
  const padding = { top: 12, right: 12, bottom: 26, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = niceMax(Math.max(...points.map((point) => point.value), 1));
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const at = (index: number, value: number) => ({
    x: padding.left + (points.length > 1 ? index * stepX : plotWidth / 2),
    y: padding.top + plotHeight - (value / max) * plotHeight,
  });

  const coords = points.map((point, index) => at(index, point.value));

  const gridlines = [0, 0.5, 1].map((fraction) => {
    const y = padding.top + plotHeight - fraction * plotHeight;
    return [
      `<line class="grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />`,
      `<text class="tick" x="${padding.left - 8}" y="${y}" text-anchor="end" dominant-baseline="central">${compact(Math.round(max * fraction))}</text>`,
    ].join('');
  });

  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`);
  const area = [
    ...line,
    `L${coords[coords.length - 1].x},${padding.top + plotHeight}`,
    `L${coords[0].x},${padding.top + plotHeight}`,
    'Z',
  ];

  // Only the ends get a tick; a label under every day collides on a 90-day window
  const axis = [0, points.length - 1]
    .filter((index, position, all) => all.indexOf(index) === position && index >= 0)
    .map(
      (index) =>
        `<text class="tick" x="${coords[index].x}" y="${height - 6}" text-anchor="${index === 0 ? 'start' : 'end'}">${esc(points[index].day)}</text>`,
    );

  const dots = points.map((point, index) => {
    const { x, y } = coords[index];
    return [
      `<g><title>${esc(`${point.day}: ${compact(point.value)}${point.frozen ? ' (frozen snapshot)' : ''}`)}</title>`,
      `<circle cx="${x}" cy="${y}" r="4" fill="var(--series-1)" stroke="var(--surface-1)" stroke-width="2" />`,
      '</g>',
    ].join('');
  });

  // The label rides above its point, except when the series peaks last — there it
  // would sit outside the viewBox, so it drops below the point instead
  const last = coords[coords.length - 1];
  const labelY = last.y - 12 < padding.top ? last.y + 18 : last.y - 12;

  return [
    `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" preserveAspectRatio="xMinYMin meet">`,
    gridlines.join(''),
    `<path d="${area.join(' ')}" fill="var(--series-1)" fill-opacity="0.1" />`,
    `<path d="${line.join(' ')}" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`,
    dots.join(''),
    `<text class="val" x="${last.x - 6}" y="${labelY}" text-anchor="end">${compact(points[points.length - 1].value)}</text>`,
    axis.join(''),
    '</svg>',
  ].join('');
}

/** Below three points a line reads as a confident slope it has not earned. */
export function trendIsReadable(points: SeriesPoint[]): boolean {
  return points.length >= 3;
}

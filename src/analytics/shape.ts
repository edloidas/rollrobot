import type { RollPart, RollResult } from 'roll-parser';

/**
 * One dice term as recorded by analytics — structure only. Numeric constants,
 * keep/drop counts and comparison values are all dropped, so `4d6kh3` and
 * `4d6kh1` collapse to the same shape.
 */
export interface DiceTerm {
  /** Position in emission order, stable across duplicates. */
  index: number;
  /** `4d6`, `1d20`, `3dF`. */
  term: string;
  /** Bounded die-size bucket used as the Analytics Engine index. */
  bucket: string;
  /** Comma-joined modifier tokens in root-to-leaf order; `''` when none. */
  modifiers: string;
}

// ! One point is written per term, against a hard limit of 250 per invocation.
const MAX_TERMS = 20;

const STANDARD_SIDES = new Set([4, 6, 8, 10, 12, 20, 100]);

const EXPLODE_TOKENS = { standard: '!', compound: '!!', penetrating: '!p' } as const;

/** `sides` is unbounded (`1d999999` is legal), so the bucket set must not be. */
function bucketOf(sides: number): string {
  return STANDARD_SIDES.has(sides) ? `d${sides}` : 'other';
}

function keepDropToken(kind: 'keep' | 'drop', selector: 'highest' | 'lowest'): string {
  return `${kind === 'keep' ? 'k' : 'd'}${selector === 'highest' ? 'h' : 'l'}`;
}

/** Modifier tokens contributed by a single node, before its children are walked. */
function tokensOf(part: RollPart): string[] {
  switch (part.type) {
    case 'keepDrop':
      return part.specs.map((spec) => keepDropToken(spec.kind, spec.selector));
    case 'explode':
      return [EXPLODE_TOKENS[part.variant]];
    case 'reroll':
      return [part.once ? 'ro' : 'r'];
    case 'dieBound':
      return [part.bound];
    case 'successCount':
      return [part.threshold.operator];
    case 'sort':
      return [part.order === 'ascending' ? 'sa' : 'sd'];
    case 'critThreshold':
      return [
        ...(part.successThresholds.length > 0 ? ['cs'] : []),
        ...(part.failThresholds.length > 0 ? ['cf'] : []),
      ];
    case 'versus':
      return ['vs'];
    default:
      return [];
  }
}

function childrenOf(part: RollPart): RollPart[] {
  switch (part.type) {
    case 'grouped':
      return [part.inner];
    case 'binaryOp':
      return [part.left, part.right];
    case 'unaryOp':
      return [part.operand];
    case 'keepDrop':
    case 'explode':
    case 'reroll':
    case 'dieBound':
    case 'successCount':
    case 'sort':
    case 'critThreshold':
      return [part.target];
    case 'versus':
      return [part.roll, part.dc];
    case 'functionCall':
      return part.args;
    case 'group':
      return part.parts;
    default:
      return [];
  }
}

/**
 * Emits one entry per distinct dice term, in tree-walk order — so the leftmost
 * term is always index `0`, and a duplicate collapses to its first occurrence
 * rather than shifting the indices after it (`2d6+2d6` records one `2d6`).
 *
 * Meta-expression dice (the `1d4` in `(1d4)d6`) are absent from the part tree,
 * so only the count they resolved to is recorded.
 */
export function shapeTerms(result: RollResult): DiceTerm[] {
  const terms: DiceTerm[] = [];
  const seen = new Set<string>();

  function walk(part: RollPart, path: string[]): void {
    if (terms.length >= MAX_TERMS) return;

    if (part.type === 'dice' || part.type === 'fateDice') {
      const term = part.type === 'dice' ? `${part.count}d${part.sides}` : `${part.count}dF`;
      const modifiers = path.join(',');
      const key = `${term}|${modifiers}`;
      if (seen.has(key)) return;

      seen.add(key);
      terms.push({
        index: terms.length,
        term,
        bucket: part.type === 'dice' ? bucketOf(part.sides) : 'dF',
        modifiers,
      });
      return;
    }

    const tokens = tokensOf(part);
    const next = tokens.length > 0 ? [...path, ...tokens] : path;
    for (const child of childrenOf(part)) walk(child, next);
  }

  walk(result.parts, []);
  return terms;
}

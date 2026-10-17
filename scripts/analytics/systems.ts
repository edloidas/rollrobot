/**
 * Maps a recorded dice shape onto the game system it hints at.
 *
 * This is a signal, never a detection. `shapeTerms` drops numeric constants, so
 * `4d6kh3` and `4d6kh1` arrive identical — the taxonomy can say "someone rolled
 * a stat array shape", not "someone played D&D". `strong` means a modifier or
 * die makes the shape distinctive; `weak` means the shape is merely consistent
 * with the system and would fit a dozen others.
 */
export interface SystemSignal {
  id: string;
  label: string;
  confidence: 'strong' | 'weak';
}

const KEEP_DROP = ['kh', 'kl', 'dh', 'dl'];
const EXPLODE = ['!', '!!', '!p'];
const COMPARE = ['>', '>=', '<', '<=', '='];
const REROLL = ['r', 'ro'];
const CRIT = ['cs', 'cf'];
const BOUND = ['min', 'max'];
const SORT = ['sa', 'sd'];

const UNPARSED: SystemSignal = { id: 'unparsed', label: 'unrecognized shape', confidence: 'weak' };

/** `blob2` is always `NdX` or `NdF` — anything else means the writer changed. */
function parseTerm(term: string): { count: number; sides: number | 'F' } | null {
  const match = /^(\d+)d(\d+|F)$/.exec(term);
  if (match == null) return null;

  return { count: Number(match[1]), sides: match[2] === 'F' ? 'F' : Number(match[2]) };
}

interface Shape {
  count: number;
  sides: number | 'F';
  has: (group: string[]) => boolean;
}

/** First match wins, so a more specific shape must precede the general one it narrows. */
const RULES: { match: (shape: Shape) => boolean; signal: SystemSignal }[] = [
  {
    match: ({ sides }) => sides === 'F',
    signal: { id: 'fate', label: 'Fate / Fudge', confidence: 'strong' },
  },
  {
    match: ({ sides, has }) => has(['vs']) && sides === 20,
    signal: { id: 'd20-vs-dc', label: 'd20 against a DC', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(['vs']),
    signal: { id: 'opposed', label: 'opposed / target number', confidence: 'strong' },
  },
  {
    match: ({ sides, count, has }) => sides === 6 && count === 4 && has(KEEP_DROP),
    signal: { id: 'stat-array', label: 'ability score array (4d6 drop)', confidence: 'strong' },
  },
  {
    match: ({ sides, has }) => sides === 20 && has(KEEP_DROP),
    signal: { id: 'd20-advantage', label: 'd20 advantage / disadvantage', confidence: 'strong' },
  },
  {
    match: ({ sides, count, has }) => sides === 10 && count >= 2 && has(EXPLODE),
    signal: {
      id: 'pool-exploding',
      label: 'exploding d10 pool (L5R, Exalted)',
      confidence: 'strong',
    },
  },
  {
    match: ({ sides, count, has }) => sides === 10 && count >= 2 && (has(COMPARE) || has(CRIT)),
    signal: { id: 'pool-d10', label: 'd10 success pool (Storyteller)', confidence: 'strong' },
  },
  {
    match: ({ sides, count, has }) => sides === 6 && count >= 3 && has(COMPARE),
    signal: { id: 'pool-d6', label: 'd6 success pool (Shadowrun)', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(COMPARE),
    signal: { id: 'success-count', label: 'success counting', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(EXPLODE),
    signal: { id: 'exploding', label: 'exploding dice', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(KEEP_DROP),
    signal: { id: 'keep-drop', label: 'keep / drop', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(CRIT),
    signal: { id: 'crit-threshold', label: 'crit thresholds', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(REROLL),
    signal: { id: 'reroll', label: 'rerolls', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(BOUND),
    signal: { id: 'bounded', label: 'bounded dice', confidence: 'strong' },
  },
  {
    match: ({ has }) => has(SORT),
    signal: { id: 'sorted', label: 'sorted dice', confidence: 'strong' },
  },
  {
    match: ({ sides }) => sides === 100,
    signal: { id: 'percentile', label: 'percentile (BRP, CoC, WFRP)', confidence: 'weak' },
  },
  {
    match: ({ sides }) => sides === 20,
    signal: { id: 'd20', label: 'bare d20', confidence: 'weak' },
  },
];

const PLAIN: SystemSignal = { id: 'plain', label: 'plain dice', confidence: 'weak' };

export function classify(term: string, modifiers: string): SystemSignal {
  const parsed = parseTerm(term);
  if (parsed == null) return UNPARSED;

  const tokens = modifiers === '' ? [] : modifiers.split(',');
  const has = (group: string[]) => tokens.some((token) => group.includes(token));
  const shape = { ...parsed, has };

  return { ...(RULES.find((rule) => rule.match(shape))?.signal ?? PLAIN) };
}

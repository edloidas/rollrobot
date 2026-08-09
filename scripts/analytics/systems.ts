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

export function classify(term: string, modifiers: string): SystemSignal {
  const parsed = parseTerm(term);
  if (parsed == null) return UNPARSED;

  const { count, sides } = parsed;
  const tokens = modifiers === '' ? [] : modifiers.split(',');
  const has = (group: string[]) => tokens.some((token) => group.includes(token));

  if (sides === 'F') return { id: 'fate', label: 'Fate / Fudge', confidence: 'strong' };

  if (has(['vs'])) {
    return sides === 20
      ? { id: 'd20-vs-dc', label: 'd20 against a DC', confidence: 'strong' }
      : { id: 'opposed', label: 'opposed / target number', confidence: 'strong' };
  }

  if (sides === 6 && count === 4 && has(KEEP_DROP)) {
    return { id: 'stat-array', label: 'ability score array (4d6 drop)', confidence: 'strong' };
  }

  if (sides === 20 && has(KEEP_DROP)) {
    return { id: 'd20-advantage', label: 'd20 advantage / disadvantage', confidence: 'strong' };
  }

  if (sides === 10 && count >= 2 && has(EXPLODE)) {
    return {
      id: 'pool-exploding',
      label: 'exploding d10 pool (L5R, Exalted)',
      confidence: 'strong',
    };
  }

  if (sides === 10 && count >= 2 && (has(COMPARE) || has(CRIT))) {
    return { id: 'pool-d10', label: 'd10 success pool (Storyteller)', confidence: 'strong' };
  }

  if (sides === 6 && count >= 3 && has(COMPARE)) {
    return { id: 'pool-d6', label: 'd6 success pool (Shadowrun)', confidence: 'strong' };
  }

  if (has(COMPARE)) return { id: 'success-count', label: 'success counting', confidence: 'strong' };
  if (has(EXPLODE)) return { id: 'exploding', label: 'exploding dice', confidence: 'strong' };
  if (has(KEEP_DROP)) return { id: 'keep-drop', label: 'keep / drop', confidence: 'strong' };
  if (has(CRIT)) return { id: 'crit-threshold', label: 'crit thresholds', confidence: 'strong' };
  if (has(REROLL)) return { id: 'reroll', label: 'rerolls', confidence: 'strong' };
  if (has(BOUND)) return { id: 'bounded', label: 'bounded dice', confidence: 'strong' };
  if (has(SORT)) return { id: 'sorted', label: 'sorted dice', confidence: 'strong' };

  if (sides === 100) {
    return { id: 'percentile', label: 'percentile (BRP, CoC, WFRP)', confidence: 'weak' };
  }

  if (sides === 20) return { id: 'd20', label: 'bare d20', confidence: 'weak' };

  return { id: 'plain', label: 'plain dice', confidence: 'weak' };
}

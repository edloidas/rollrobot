import { capLabel, QUOTE_PAIRS } from './label';

/**
 * Separator tiers, most specific first. The first tier present in the input is the
 * only one that splits it, so an option may contain every separator below its own
 * tier — `Potion of Healing, Greater | Armor, +1 Chain Mail` keeps its commas.
 *
 * ? Newline outranks the rest because a pasted table is the one form that is never
 * ambiguous: no option ever contains a line break. `;` and `؛` share the pipe tier
 * because a semicolon costs one mobile keyboard switch against the pipe's two, and
 * `،` is what a Persian keyboard emits for a comma.
 */
const TIERS = [
  { tier: 'newline', pattern: /\n/, bullets: true },
  { tier: 'explicit', pattern: /[|;؛]/, bullets: false },
  { tier: 'comma', pattern: /[,،]/, bullets: false },
] as const;

export type SeparatorTier = (typeof TIERS)[number]['tier'] | 'space';

const SEPARATOR_CHARS = new Set([...'\n|;؛,،']);

/** Markdown list markers, stripped from pasted tables. The trailing space is required
 * so a negative modifier (`-5 penalty`) keeps its sign. */
const BULLET = /^(?:[-•*–—]|\d+[.)])\s+/;

export interface SplitOptions {
  options: string[];
  /** Trailing quoted label, capped, or `null` when none was given. */
  label: string | null;
  /** Which tier did the splitting, or `null` when there was nothing to split. */
  tier: SeparatorTier | null;
}

interface QuotedTail {
  head: string;
  label: string | null;
  /** The entire input is one quoted span, so nothing inside it may be split. */
  wrapped: boolean;
}

/**
 * Splits a trailing quoted label off the options, scanning backwards from the end.
 *
 * ? Deliberately not `extractLabel`. That one guesses a split and then *validates* it
 * against the parser, which is the only thing rejecting a bad guess — a pick list has no
 * grammar to validate against, so the guess would always be trusted. Ungated, the same
 * candidate order silently eats an option: `Rock | Paper | «Ножницы»` becomes two options
 * labelled `Ножницы`, and `«…»` is the default pair on ru/uk/be keyboards.
 *
 * Three conditions replace the parse gate. The closing quote must end the input, the
 * opener must sit at a word boundary (so `don't | can't` keeps both options), and the
 * head must not end on a separator — that last one is what keeps a fully quoted final
 * option an option rather than a label.
 */
function extractQuotedTail(trimmed: string): QuotedTail {
  const whole = { head: trimmed, label: null, wrapped: false };
  const openers = QUOTE_PAIRS[trimmed.at(-1) ?? ''];
  if (openers == null) return whole;

  for (let i = trimmed.length - 2; i >= 0; i--) {
    if (!openers.includes(trimmed.charAt(i))) continue;
    if (i !== 0 && !/\s/.test(trimmed.charAt(i - 1))) continue;

    const head = trimmed.slice(0, i).trim();
    if (head === '') return { ...whole, wrapped: true };
    if (SEPARATOR_CHARS.has(head.slice(-1))) return whole;
    // A head closing on a quote means the option before this one was quoted too, so these
    // are quoted options rather than a labelled list — `"Alpha" "Beta"` must keep both
    if (QUOTE_PAIRS[head.slice(-1)] != null) return whole;
    // An odd count leaves an opener unclosed in the head, so the quote found here closes
    // that one instead of opening a label — `a, b "he said "hi""` keeps its nested quotes
    if (countAny(head, openers) % 2 === 1) return whole;

    const label = trimmed.slice(i + 1, -1).trim();
    return { head, label: label === '' ? null : capLabel(label), wrapped: false };
  }

  return whole;
}

function countAny(text: string, chars: string): number {
  return [...text].filter((char) => chars.includes(char)).length;
}

function clean(parts: string[], bullets: boolean): string[] {
  return parts
    .map((part) => {
      const trimmed = part.trim();
      return bullets ? trimmed.replace(BULLET, '').trim() : trimmed;
    })
    .filter((part) => part !== '');
}

/**
 * Splits pick input into its options and its label: `Rock | Paper "coin flip"` becomes
 * two options labelled `coin flip`. Options are trimmed and empties dropped, so a
 * trailing separator costs nothing; duplicates survive and act as weights.
 *
 * `tier` reports which separator won, and is `null` when fewer than two options came
 * out — a lone option was never really split, whatever characters it contains.
 *
 * ! Never run `normalizeNotation` over any of this. It folds Cyrillic `к`/`д` to `d` for
 *   the roll path, which would turn `/pick кубик, карта` into `dубик`, and it rewrites a
 *   bare `5 10` into `5d10`. Options are prose, not notation.
 */
export function splitOptions(input: string): SplitOptions {
  const { head, label, wrapped } = extractQuotedTail(input.trim());

  // Quoting the whole input is how someone keeps a phrase together, not how they list one
  if (wrapped) return { options: [head], label, tier: null };

  for (const { tier, pattern, bullets } of TIERS) {
    if (!pattern.test(head)) continue;
    const options = clean(head.split(pattern), bullets);
    return { options, label, tier: options.length > 1 ? tier : null };
  }

  const options = clean(head.split(/\s+/), false);
  return { options, label, tier: options.length > 1 ? 'space' : null };
}

import type { RNG } from 'roll-parser';
import { roll } from 'roll-parser';
import { createMockRng } from 'roll-parser/testing';
import { formatDetailedResult, formatResult, withLabel } from '../../src/format';
import { ROLL_LIMITS } from '../../src/limits';
import type { CommandDoc, Example, LocalizedManual, Manual, SystemRecipe } from '../content/types';

export type ResolvedExample = Example & { replyHtml: string };

export type ResolvedManual = Omit<LocalizedManual, 'commands' | 'systems'> & {
  commands: Omit<Manual['commands'], 'items'> & {
    items: (Omit<CommandDoc, 'example'> & { example?: ResolvedExample })[];
  };
  systems: Omit<Manual['systems'], 'items'> & {
    items: (Omit<SystemRecipe, 'example'> & { example: ResolvedExample })[];
  };
};

/** Wraps a scripted RNG so the caller can compare draws taken against draws supplied. */
function countingRng(values: number[], count: { drawn: number }): RNG {
  const scripted = createMockRng(values);

  return {
    next: () => {
      count.drawn += 1;
      return scripted.next();
    },
    nextInt: (min, max) => {
      count.drawn += 1;
      return scripted.nextInt(min, max);
    },
  };
}

/**
 * Replies already produced, keyed on the `Example` object itself.
 *
 * `resolveManual` assigns an untranslated section English's own object rather
 * than a copy, so seven of the eight locales hand this module the very same
 * examples. Keyed on identity, that makes the repeats free — and only ever
 * returns a reply built from the exact object asked about.
 */
const rendered = new WeakMap<Example, ResolvedExample>();

/**
 * Produces the reply bytes the bot would send for one example, using the bot's own
 * formatters against a scripted RNG.
 *
 * A miscounted `rng` array throws in either direction. Too few draws and
 * `createMockRng` runs dry; too many and nothing else would notice — the surplus
 * is never asked for, so an example whose notation changed under a stale array
 * would still render. A throw is never cached, so the guard fires on every pass.
 */
export function renderExample(example: Example): ResolvedExample {
  const memoized = rendered.get(example);
  if (memoized !== undefined) return memoized;

  const count = { drawn: 0 };
  let replyHtml: string;

  try {
    const result = roll(example.notation, {
      ...ROLL_LIMITS,
      rng: countingRng(example.rng, count),
    });
    const body = example.mode === 'full' ? formatDetailedResult(result) : formatResult(result);
    replyHtml = withLabel(body, example.label);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Example "${example.notation}" could not be rolled: ${reason}`);
  }

  if (count.drawn !== example.rng.length) {
    throw new Error(
      `Example "${example.notation}" scripts ${example.rng.length} RNG draw(s) but rolled ` +
        `${count.drawn} — remove the ${example.rng.length - count.drawn} unused draw(s)`,
    );
  }

  const resolved: ResolvedExample = { ...example, replyHtml };
  rendered.set(example, resolved);

  return resolved;
}

/** Walks the manual and resolves every example it carries. */
export function resolveExamples(manual: LocalizedManual): ResolvedManual {
  return {
    ...manual,
    commands: {
      ...manual.commands,
      items: manual.commands.items.map((item) => ({
        ...item,
        example: item.example == null ? undefined : renderExample(item.example),
      })),
    },
    systems: {
      ...manual.systems,
      items: manual.systems.items.map((item) => ({
        ...item,
        example: renderExample(item.example),
      })),
    },
  };
}

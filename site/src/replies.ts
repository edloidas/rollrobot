import type { RNG } from 'roll-parser';
import { roll } from 'roll-parser';
import { createMockRng } from 'roll-parser/testing';
import { formatDetailedResult, formatResult, withLabel } from '../../src/format';
import { askReply } from '../../src/handlers/ask';
import { pickReply } from '../../src/handlers/pick';
import { ROLL_LIMITS } from '../../src/limits';
import { normalizeNotation } from '../../src/notation';
import type {
  AskExample,
  CommandDoc,
  Example,
  FeatureDoc,
  LocalizedManual,
  Manual,
  PickExample,
  RollExample,
  SystemRecipe,
} from '../content/types';

/** An example plus what the page shows for it: the line you type, and the bot's answer. */
export type ResolvedExample = Example & { typed: string; replyHtml: string };

export type ResolvedManual = Omit<LocalizedManual, 'commands' | 'specialFeatures' | 'systems'> & {
  commands: Omit<Manual['commands'], 'items'> & {
    items: (Omit<CommandDoc, 'example'> & { example?: ResolvedExample })[];
  };
  specialFeatures: Omit<Manual['specialFeatures'], 'items'> & {
    items: (Omit<FeatureDoc, 'example'> & { example?: ResolvedExample })[];
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
 * How many times an outcome-pinned example may re-ask its handler.
 *
 * `askReply` and `pickReply` roll their own die and take no RNG, so the only way
 * to show a chosen outcome without editing `src/` is to ask again until it comes
 * up. Two hundred attempts puts the odds of a spurious build failure at 2^-200
 * for `/ask` and around 10^-35 for a three-option `/pick` — a cap against an
 * impossible outcome becoming an infinite loop, not a real limit.
 */
const MAX_ATTEMPTS = 200;

function rollReply(example: RollExample): string {
  const count = { drawn: 0 };
  // The bot folds before it parses, so the example does too: `4 6`, `2к6` and
  // `۲۰` reach the parser as `4d6`, `2d6` and `d20`, exactly as in a chat.
  const notation = normalizeNotation(example.notation);
  let replyHtml: string;

  try {
    const result = roll(notation, { ...ROLL_LIMITS, rng: countingRng(example.rng, count) });
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

  return replyHtml;
}

function askAnswer(example: AskExample): string {
  const wanted = example.answer === 'yes' ? '<b>Yes</b>' : '<b>No</b>';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const answer = askReply(example.question);
    if (answer.text.includes(wanted)) return answer.text;
  }

  throw new Error(
    `Ask example "${example.question}" never answered ${example.answer} in ${MAX_ATTEMPTS} ` +
      `attempts — askReply no longer returns that answer`,
  );
}

function pickChoice(example: PickExample): string {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const pick = pickReply(example.input);
    if (pick.choice === example.choice) return pick.text;
  }

  throw new Error(
    `Pick example "${example.input}" never chose "${example.choice}" in ${MAX_ATTEMPTS} ` +
      `attempts — it is not one of the options the input splits into`,
  );
}

/** The line a user types to get this reply, command included. */
function typedLine(example: Example): string {
  if (example.kind === 'ask') return `/ask ${example.question}`;
  if (example.kind === 'pick') return `/pick ${example.input}`;

  const command = example.mode === 'full' ? '/full' : '/roll';
  const label = example.label == null ? '' : ` "${example.label}"`;

  return `${command} ${example.notation}${label}`;
}

/**
 * Produces the reply one example would draw, using the bot's own handlers.
 *
 * A roll is pinned by its scripted RNG, and a miscounted `rng` array throws in
 * either direction: too few draws and `createMockRng` runs dry, too many and
 * nothing else would notice, so an example whose notation changed under a stale
 * array would still render. A throw is never cached, so the guard fires on every
 * pass.
 */
export function renderExample(example: Example): ResolvedExample {
  const memoized = rendered.get(example);
  if (memoized !== undefined) return memoized;

  let replyHtml: string;
  if (example.kind === 'ask') replyHtml = askAnswer(example);
  else if (example.kind === 'pick') replyHtml = pickChoice(example);
  else replyHtml = rollReply(example);

  const resolved: ResolvedExample = { ...example, typed: typedLine(example), replyHtml };
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
    specialFeatures: {
      ...manual.specialFeatures,
      items: manual.specialFeatures.items.map((item) => ({
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

/**
 * One worked example, rendered from the bot's own handlers at build time.
 *
 * `kind` picks which handler answers it, and with it which command heads the
 * typed line shown above the reply.
 */
export type Example = RollExample | AskExample | PickExample;

/** A roll. The notation is normalized exactly as the bot normalizes it, then rolled. */
export interface RollExample {
  kind?: 'roll';
  /**
   * Exactly as a user would type it after the command — shorthands included.
   * `4 6`, `2к6` and `۲۰` are all legitimate here; the bot folds them itself.
   */
  notation: string;
  /** Scripted RNG draws. Must match the roll's draw count or the build fails loudly. */
  rng: number[];
  /** `compact` mirrors /roll, `full` mirrors /full. */
  mode: 'compact' | 'full';
  /** Optional roll name, rendered as the quoted label the bot puts above a reply. */
  label?: string;
}

/** An `/ask` example: Yes or No above the question, quoted. */
export interface AskExample {
  kind: 'ask';
  /**
   * Everything after the command. Needs no quoting — the whole line is the question.
   * Omitted for the bare `/ask`, which answers with nothing quoted above it.
   */
  question?: string;
  /** Which of the two answers to show. See `renderExample` for how it is pinned. */
  answer: 'yes' | 'no';
}

/** A `/pick` example: one option out of the list, bolded. */
export interface PickExample {
  kind: 'pick';
  /** Everything after the command, separators included. */
  input: string;
  /** Which option to show as chosen. Must be one of the options `input` splits into. */
  choice: string;
}

export interface CommandDoc {
  /** Command without the slash, e.g. `roll`. */
  command: string;
  /** Shortcut without the slash, e.g. `r`. Omitted when there is none. */
  shortcut?: string;
  summary: string;
  /** Points too fiddly for the summary, rendered as a list beneath it. */
  notes?: string[];
  /** Worked examples in the order shown. Omitted by a command that answers nothing. */
  examples?: Example[];
}

/** One convenience that works across commands, rather than a notation form. */
export interface FeatureDoc {
  /** Short name, e.g. `Cyrillic dice letters`. */
  title: string;
  /** The literal it is about is marked with backticks, as all prose is. */
  description: string;
  /** A rule that has to be followed, set apart from the description. */
  important?: string;
  example?: Example;
}

export interface NotationRow {
  notation: string;
  description: string;
}

export interface NotationGroup {
  heading: string;
  rows: NotationRow[];
}

export interface SystemRecipe {
  system: string;
  description: string;
  example: Example;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Manual {
  meta: {
    title: string;
    description: string;
    /**
     * One line for a link preview card — Telegram's above all, which is where
     * this page gets shared. Separate from `description`, which is written for a
     * search result and runs too long to survive a card. Names the author, which
     * a search snippet has no reason to.
     */
    social: string;
  };
  hero: { tagline: string; cta: string };
  gettingStarted: { heading: string; body: string[] };
  commands: { heading: string; intro: string; items: CommandDoc[] };
  /**
   * Commands that ship but are not settled yet, kept out of `commands` because the
   * two sections promise different things: one is stable, the other may change
   * shape or leave the bot. The intro is what carries that warning, so a
   * translation that drops it drops the only thing separating the two lists.
   */
  betaFeatures: { heading: string; intro: string; items: CommandDoc[] };
  specialFeatures: { heading: string; intro: string; items: FeatureDoc[] };
  inline: { heading: string; body: string[] };
  notation: {
    heading: string;
    intro: string;
    /** Card labels for the two outbound roll-parser links. The URLs are not translated. */
    links: { playground: string; reference: string };
    groups: NotationGroup[];
  };
  systems: { heading: string; intro: string; items: SystemRecipe[] };
  limits: { heading: string; body: string[] };
  faq: { heading: string; items: FaqItem[] };
  footer: { playground: string; reference: string; source: string };
}

/** A translation in progress. Any absent section falls back to English whole. */
export type PartialManual = { [K in keyof Manual]?: Manual[K] };

/** Per section: `true` when English stood in because the locale supplies none. */
export type FallbackSections = Record<keyof Manual, boolean>;

/**
 * A resolved manual that still remembers which of its sections are English.
 *
 * The renderer needs that: a `/fa/` page whose `commands` section fell back is
 * an English block inside an RTL document, and without a `lang`/`dir` mark the
 * browser lays it out right-to-left and a screen reader reads it in Persian.
 */
export interface LocalizedManual extends Manual {
  fallback: FallbackSections;
}

/** Every top-level section name, used by the resolver and its completeness test. */
export const MANUAL_SECTIONS = [
  'meta',
  'hero',
  'gettingStarted',
  'commands',
  'betaFeatures',
  'specialFeatures',
  'inline',
  'notation',
  'systems',
  'limits',
  'faq',
  'footer',
] as const satisfies readonly (keyof Manual)[];

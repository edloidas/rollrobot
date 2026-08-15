/** One worked example: notation, the dice it should draw, and how the bot replies to it. */
export interface Example {
  /** Notation exactly as a user would type it, without the leading command. */
  notation: string;
  /** Scripted RNG draws. Must match the notation's draw count or the build fails loudly. */
  rng: number[];
  /** `compact` mirrors /roll, `full` mirrors /full. */
  mode: 'compact' | 'full';
  /** Optional roll name, rendered as the quoted label the bot puts above a reply. */
  label?: string;
}

export interface CommandDoc {
  /** Command without the slash, e.g. `roll`. */
  command: string;
  /** Shortcut without the slash, e.g. `r`. Omitted when there is none. */
  shortcut?: string;
  summary: string;
  /** Omitted by a command that rolls nothing — the caption is built from `mode`. */
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
  meta: { title: string; description: string };
  hero: { tagline: string; cta: string };
  gettingStarted: { heading: string; body: string[] };
  commands: { heading: string; intro: string; items: CommandDoc[] };
  inline: { heading: string; body: string[] };
  notation: {
    heading: string;
    intro: string;
    groups: NotationGroup[];
    /** Link text for the outbound roll-parser reference. The URL is not translated. */
    referenceLabel: string;
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
  'inline',
  'notation',
  'systems',
  'limits',
  'faq',
  'footer',
] as const satisfies readonly (keyof Manual)[];

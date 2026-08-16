import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../../src/i18n';
import { splitOptions } from '../../src/options';
import { MANUALS, mergeOverEnglish, resolveManual } from '../../site/content';
import type { Example, Manual } from '../../site/content/types';
import { MANUAL_SECTIONS } from '../../site/content/types';
import { en } from '../../site/content/en';

describe('MANUALS', () => {
  test('covers exactly the locales the bot supports', () => {
    expect(Object.keys(MANUALS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});

describe('resolveManual', () => {
  test('returns English unchanged for en', () => {
    const resolved = resolveManual('en');
    for (const section of MANUAL_SECTIONS) {
      expect(resolved[section]).toEqual(en[section]);
    }
  });

  test('fills every section for every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const manual = resolveManual(locale);
      for (const section of MANUAL_SECTIONS) {
        expect(manual[section]).toBeDefined();
      }
    }
  });

  // Every shipped locale is translated whole, so no page mixes two languages.
  // A locale added later may land section by section — that path is
  // `mergeOverEnglish`'s, tested below rather than through a half-done locale.
  test('leaves no section of any locale to English', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { fallback } = resolveManual(locale);
      for (const section of MANUAL_SECTIONS) {
        expect(fallback[section]).toBe(false);
      }
    }
  });
});

describe('mergeOverEnglish', () => {
  test('takes English for every section a translation omits', () => {
    const merged = mergeOverEnglish({});
    for (const section of MANUAL_SECTIONS) {
      expect(merged[section]).toEqual(en[section]);
      expect(merged.fallback[section]).toBe(true);
    }
  });

  test('keeps a supplied section and marks only the rest fallen back', () => {
    const hero = { tagline: 'A translated tagline.', cta: 'Open' };
    const merged = mergeOverEnglish({ hero });

    expect(merged.hero).toEqual(hero);
    expect(merged.fallback.hero).toBe(false);
    expect(merged.footer).toEqual(en.footer);
    expect(merged.fallback.footer).toBe(true);
  });

  test('carries an entry for every section', () => {
    const { fallback } = mergeOverEnglish({});
    expect(Object.keys(fallback).sort()).toEqual([...MANUAL_SECTIONS].sort());
  });
});

/**
 * The half of an example a translator must leave alone: which handler answers it
 * and what it rolls. The other half — a quoted name, a question, a pick list — is
 * chat content and differs by design.
 */
function exampleSpine(example: Example | undefined) {
  if (example === undefined) return null;
  if (example.kind === 'ask') return { kind: 'ask', answer: example.answer };
  if (example.kind === 'pick') return { kind: 'pick' };

  return { kind: 'roll', notation: example.notation, rng: example.rng, mode: example.mode };
}

function commandSpine(items: Manual['commands']['items']) {
  return items.map((item) => ({
    command: item.command,
    shortcut: item.shortcut,
    notes: item.notes?.length,
    examples: item.examples?.map(exampleSpine),
  }));
}

/** Everything a translation shares with English, prose excluded. */
function spine(manual: Manual) {
  return {
    gettingStarted: manual.gettingStarted.body.length,
    commands: commandSpine(manual.commands.items),
    betaFeatures: commandSpine(manual.betaFeatures.items),
    specialFeatures: manual.specialFeatures.items.map((item) => exampleSpine(item.example)),
    inline: manual.inline.body.length,
    notation: manual.notation.groups.map((group) => group.rows.map((row) => row.notation)),
    systems: manual.systems.items.map((item) => ({
      system: item.system,
      example: exampleSpine(item.example),
    })),
    limits: manual.limits.body.length,
    faq: manual.faq.items.length,
  };
}

// Eight files, one per locale, each edited on its own. Notation, scripted RNG,
// command names and game titles are not translatable, and a translation that
// drifts on any of them either fails the build loudly (a miscounted `rng`) or,
// worse, quietly documents notation the bot does not accept.
describe('every locale', () => {
  test('keeps English notation, dice and structure', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect({ locale, spine: spine(resolveManual(locale)) }).toEqual({
        locale,
        spine: spine(en),
      });
    }
  });

  // Split by the bot's own tiers, not by `|`: a comma-separated example never
  // reaches the pipe tier, and a hand-rolled split would pass it whole.
  test('picks a choice its own option list contains', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const manual = resolveManual(locale);
      const examples = [
        ...manual.commands.items.flatMap((item) => item.examples ?? []),
        ...manual.betaFeatures.items.flatMap((item) => item.examples ?? []),
        ...manual.specialFeatures.items.map((item) => item.example),
      ];

      for (const example of examples) {
        if (example?.kind !== 'pick') continue;
        expect(splitOptions(example.input).options).toContain(example.choice);
      }
    }
  });
});

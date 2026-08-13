import { describe, expect, test } from 'bun:test';
import { extractLabel } from '../src/label';

/** The prototype is opt-in, so every case here names the mode under test. */
const split = (input: string) => extractLabel(input, 'strict');

describe('extractLabel — unquoted trailing labels (prototype #70)', () => {
  test('splits a label off the end with no quotes typed', () => {
    expect(split('1d20+3 На внимательность')).toEqual({
      notation: '1d20+3',
      label: 'На внимательность',
    });
    expect(split('4d6kh3 stat roll for Grog')).toEqual({
      notation: '4d6kh3',
      label: 'stat roll for Grog',
    });
    expect(split('2d6 урон мечом')).toEqual({ notation: '2d6', label: 'урон мечом' });
  });

  // Parseability is not monotonic along the prefixes: `1d20 +` fails where `1d20 + 3`
  // succeeds, so a scan that stopped at the first failure would label `+ 3 for luck`
  test('takes the longest parseable prefix, not the first', () => {
    expect(split('1d20 + 3 for luck')).toEqual({ notation: '1d20 + 3', label: 'for luck' });
    expect(split('2d6 kh1 keep the best one')).toEqual({
      notation: '2d6 kh1',
      label: 'keep the best one',
    });
    expect(split('4d6 dl1 for the new PC')).toEqual({
      notation: '4d6 dl1',
      label: 'for the new PC',
    });
  });

  test('leaves whitespace-separated notation whole', () => {
    expect(split('2d6 kh1')).toEqual({ notation: '2d6 kh1', label: null });
    expect(split('1d20 + 3')).toEqual({ notation: '1d20 + 3', label: null });
    expect(split('2 10 -1')).toEqual({ notation: '2 10 -1', label: null });
    expect(split('d20 s')).toEqual({ notation: 'd20 s', label: null });
    expect(split('d20 k')).toEqual({ notation: 'd20 k', label: null });
  });

  // ! The severe failure class: a split that changes the dice rolled rather than the label.
  //   A count proves the modifier was meant, a bare word does not — so `kh1` stays and `s` goes
  test('never lets a bare modifier word absorb a word of prose', () => {
    expect(split('1d20 s ok?')).toEqual({ notation: '1d20', label: 's ok?' });
    expect(split('d20 kh check the door')).toEqual({ notation: 'd20', label: 'kh check the door' });
    expect(split('2d6 kh1 attack roll')).toEqual({ notation: '2d6 kh1', label: 'attack roll' });
  });

  // The parser's bare modifier vocabulary is much wider than `s` / `kh` / `dl`, and folding
  // adds Cyrillic spellings on top — requiring a count covers both without enumerating either
  test('holds for the whole modifier vocabulary, folded spellings included', () => {
    expect(split('2d6 ! круто')).toEqual({ notation: '2d6', label: '! круто' });
    expect(split('2d6 k! ok')).toEqual({ notation: '2d6', label: 'k! ok' });
    expect(split('2d6 cf note')).toEqual({ notation: '2d6', label: 'cf note' });
    expect(split('4d6 кh лучший')).toEqual({ notation: '4d6', label: 'кh лучший' });
    expect(split('2d6 sк по возрастанию')).toEqual({ notation: '2d6', label: 'sк по возрастанию' });
  });

  // ! Rejecting the longest prefix must end the scan, not fall through to a shorter one —
  //   `4d6 kh3 6` dropping to `4d6` would roll dice the user never asked for
  test('errors rather than rolling a shortened prefix', () => {
    expect(split('4d6 kh3 6')).toEqual({ notation: '4d6 kh3 6', label: null });
    expect(split('1d20 + 1d6 2')).toEqual({ notation: '1d20 + 1d6 2', label: null });
    expect(split('1d20 + 1d6 два')).toEqual({ notation: '1d20 + 1d6', label: 'два' });
  });

  // ! The scan parses once per word, so an unbounded one turns any long message into Worker CPU
  test('bounds the scan so a long message cannot be a roll', () => {
    const long = `2d6 ${Array(1000).fill('and').join(' ')}`;
    const start = performance.now();
    expect(split(long).notation).toBe('2d6');
    expect(performance.now() - start).toBeLessThan(20);
  });

  // ! A bound that truncates is the bug it was meant to prevent — the prefix still parses, so
  //   the roll would go out short with nothing in the reply saying so. Refuse instead
  test('keeps notation that runs long, and refuses rather than shortening it', () => {
    expect(split('2d6 + 1d8 + 1d4 + 2 + 1 урон от удара')).toEqual({
      notation: '2d6 + 1d8 + 1d4 + 2 + 1',
      label: 'урон от удара',
    });
    // Both parities: the ceiling lands on a success for one and a miss for the other, and a
    // truncated prefix parses either way — so the refusal cannot key off the last verdict
    for (const head of ['1d20', '- 1d20']) {
      const stacked = `${head} ${Array(20).fill('+ 1').join(' ')} с бонусами`;
      expect(split(stacked).label).toBeNull();
    }
  });

  // A modifier may hold its count at arm's length, and the parser accepts it that way
  test('keeps a spaced modifier together with its count', () => {
    expect(split('2d6 vs 15 урона')).toEqual({ notation: '2d6 vs 15', label: 'урона' });
    expect(split('4d6 kh 3 stats')).toEqual({ notation: '4d6 kh 3', label: 'stats' });
    expect(split('4d6 dl 1 худший')).toEqual({ notation: '4d6 dl 1', label: 'худший' });
  });

  // ! A prefix cut inside a group can never parse, so it is not evidence that the notation
  //   ended. Counting it as one would drop half of `(1d20 vs 15) + (1d20 vs 20)`
  test('does not mistake a bracket cut for the end of the notation', () => {
    expect(split('(1d20 vs 15) + (1d20 vs 20) на удачу')).toEqual({
      notation: '(1d20 vs 15) + (1d20 vs 20)',
      label: 'на удачу',
    });
    expect(split('1d20 vs (5 vs 3) проверка')).toEqual({
      notation: '1d20 vs (5 vs 3)',
      label: 'проверка',
    });
    expect(split('{1d20 vs 15, 1d6 vs 10, 1d4}kh2 атака')).toEqual({
      notation: '{1d20 vs 15, 1d6 vs 10, 1d4}kh2',
      label: 'атака',
    });
  });

  // Nobody names a roll `+`. Keeping the error is worth more than the label
  test('reports a half-typed modifier instead of labelling it', () => {
    expect(split('1d20 +')).toEqual({ notation: '1d20 +', label: null });
    expect(split('3d6 +')).toEqual({ notation: '3d6 +', label: null });
    expect(split('2d6 x')).toEqual({ notation: '2d6 x', label: null });
  });

  test('leaves an unparseable input whole for the parser to report on', () => {
    expect(split('1d20+')).toEqual({ notation: '1d20+', label: null });
    expect(split('2dd6')).toEqual({ notation: '2dd6', label: null });
    expect(split('Should I text her?')).toEqual({ notation: 'Should I text her?', label: null });
    expect(split('Стоит ли идти на свидание?')).toEqual({
      notation: 'Стоит ли идти на свидание?',
      label: null,
    });
  });

  // A lone bare number is shorthand for a die, but it is also how a question starts.
  // The multi-word shorthand is unambiguous enough to keep
  test('requires a named die, or the multi-word shorthand', () => {
    expect(split('20 bucks worth it?')).toEqual({ notation: '20 bucks worth it?', label: null });
    expect(split('2 more beers?')).toEqual({ notation: '2 more beers?', label: null });
    expect(split('2 10 -1 урона')).toEqual({ notation: '2 10 -1', label: 'урона' });
  });

  test('reads the Cyrillic die letter as a die', () => {
    expect(split('2к6 к бою')).toEqual({ notation: '2к6', label: 'к бою' });
    expect(split('1д20+3 на восприятие')).toEqual({ notation: '1д20+3', label: 'на восприятие' });
  });

  // ! `2 к 1` is the Russian odds idiom — "two to one" — and it folds to `2 d 1`, which parses.
  //   A standalone `к` is prose, so the die letter only counts written against its numbers
  test('does not read the Russian odds idiom as a roll', () => {
    expect(split('2 к 1 что он опоздает')).toEqual({
      notation: '2 к 1 что он опоздает',
      label: null,
    });
  });

  // A successful roll always beats a label, in both directions
  test('prefers a whole-input roll over any split', () => {
    expect(split('4d6kh3')).toEqual({ notation: '4d6kh3', label: null });
    expect(split('d20 s')).toEqual({ notation: 'd20 s', label: null });
  });

  test('still prefers a quoted split over a prefix split', () => {
    expect(split('2d6 kh1 "keep the best"')).toEqual({
      notation: '2d6 kh1',
      label: 'keep the best',
    });
  });

  // The quoted path gives up on this one, and the prefix path picks it up — so an input that
  // errors today starts rolling. Rescued rather than regressed, but it is a behaviour change
  test('rescues a stray apostrophe the quoted path leaves whole', () => {
    expect(extractLabel("d20 it's a trap'")).toEqual({ notation: "d20 it's a trap'", label: null });
    expect(split("d20 it's a trap'")).toEqual({ notation: 'd20', label: "it's a trap'" });
  });

  test('caps an overlong unquoted label', () => {
    const { label } = split(`2d6 ${'x'.repeat(500)}`);
    expect([...(label as string)]).toHaveLength(100);
    expect(label).toEndWith('…');
  });

  test('is off by default, so the shipped behaviour is unchanged', () => {
    expect(extractLabel('1d20+3 На внимательность')).toEqual({
      notation: '1d20+3 На внимательность',
      label: null,
    });
  });
});

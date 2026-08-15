import { describe, expect, test } from 'bun:test';
import { resolveManual } from '../../site/content';
import { en } from '../../site/content/en';
import { renderExample, resolveExamples } from '../../site/src/replies';

const english = resolveManual('en');

describe('renderExample', () => {
  test('renders a compact reply exactly as the bot would', () => {
    const resolved = renderExample({ notation: '2d20+5', rng: [11, 4], mode: 'compact' });
    expect(resolved.replyHtml).toBe('<code>2d20 + 5</code> = <b>20</b>');
  });

  test('renders a detailed reply with the breakdown', () => {
    const resolved = renderExample({ notation: '4d6kh3', rng: [6, 5, 3, 2], mode: 'full' });
    expect(resolved.replyHtml).toContain('<code>4d6kh3</code> = <b>14</b>');
    expect(resolved.replyHtml).toContain('<s>2</s>');
  });

  test('puts a label above the reply as a quote', () => {
    const resolved = renderExample({
      notation: '1d20+7',
      rng: [13],
      mode: 'compact',
      label: 'Perception',
    });
    expect(resolved.replyHtml).toStartWith('<blockquote>Perception</blockquote>\n');
  });

  test('fails loudly when the notation asks for more draws than are scripted', () => {
    expect(() => renderExample({ notation: '4d6', rng: [1, 2], mode: 'compact' })).toThrow(/4d6/);
  });

  test('fails loudly when the scripted draws outnumber what the notation rolls', () => {
    expect(() => renderExample({ notation: '2d6', rng: [1, 2, 3, 4], mode: 'compact' })).toThrow(
      /Example "2d6" scripts 4 RNG draw\(s\) but rolled 2/,
    );
  });

  test('accepts a sequence that matches the notation exactly', () => {
    expect(() => renderExample({ notation: '2d6', rng: [1, 2], mode: 'compact' })).not.toThrow();
  });
});

describe('resolveExamples', () => {
  test('attaches a reply to every example in the manual', () => {
    const resolved = resolveExamples(english);
    const replies = [...resolved.commands.items, ...resolved.systems.items]
      .map((item) => item.example)
      .filter((example) => example != null);

    // Counted against the source, so resolving nothing cannot pass.
    const sources = [...en.commands.items, ...en.systems.items].filter(
      (item) => item.example != null,
    );

    expect(replies).toHaveLength(sources.length);
    for (const example of replies) {
      expect(example.replyHtml.length).toBeGreaterThan(0);
    }
  });

  test('leaves a command carrying no example unresolved', () => {
    const resolved = resolveExamples({
      ...english,
      commands: { ...en.commands, items: [{ command: 'help', summary: 'Notation guide.' }] },
    });
    expect(resolved.commands.items[0].example).toBeUndefined();
  });
});

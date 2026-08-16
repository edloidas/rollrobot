import { describe, expect, test } from 'bun:test';
import { resolveManual } from '../../site/content';
import { en } from '../../site/content/en';
import { prose, renderHero, renderManual, renderTabs } from '../../site/src/render';
import { resolveExamples } from '../../site/src/replies';

const english = resolveManual('en');
const manual = resolveExamples(english);
/** Stands in for a locale with no translation at all — every section is English. */
const fallenBack = resolveExamples(resolveManual('fa'));

describe('prose', () => {
  test('renders a backtick span as isolated inline code', () => {
    expect(prose('send /roll 2d6+3 to it')).toBe('send /roll 2d6+3 to it');
    expect(prose('send `/roll 2d6+3` to it')).toBe('send <code dir="ltr">/roll 2d6+3</code> to it');
  });

  test('renders every span on a line, not just the first', () => {
    expect(prose('`/roll` and `/full`')).toBe(
      '<code dir="ltr">/roll</code> and <code dir="ltr">/full</code>',
    );
  });

  test('escapes before it marks up, so a span cannot introduce markup', () => {
    expect(prose('`<img src=x onerror=alert(1)>`')).toBe(
      '<code dir="ltr">&lt;img src=x onerror=alert(1)&gt;</code>',
    );
    expect(prose('a & b `2d6>=5` <tag>')).toBe(
      'a &amp; b <code dir="ltr">2d6&gt;=5</code> &lt;tag&gt;',
    );
  });

  test('renders a bold span', () => {
    expect(prose('**Required.** The rest is not.')).toBe(
      '<strong>Required.</strong> The rest is not.',
    );
  });

  test('leaves a bold delimiter inside a code span alone', () => {
    expect(prose('`2**3` is not bold')).toBe('<code dir="ltr">2**3</code> is not bold');
  });

  test('leaves an unpaired backtick as a literal', () => {
    expect(prose('a ` b')).toBe('a ` b');
    expect(prose('`/roll` and a stray `')).toBe('<code dir="ltr">/roll</code> and a stray `');
  });
});

describe('renderHero', () => {
  test('links the CTA at the tg scheme', () => {
    expect(renderHero(manual, 'en')).toContain('href="tg://resolve?domain=rollrobot"');
  });

  test('shows the handle', () => {
    expect(renderHero(manual, 'en')).toContain('@rollrobot');
  });

  test('leaves the hero unmarked when the locale supplies its own', () => {
    expect(renderHero(manual, 'en')).toContain('<header class="hero">');
  });

  test('marks a fallen-back hero as English and left-to-right', () => {
    expect(renderHero(fallenBack, 'fa')).toContain('<header class="hero" lang="en" dir="ltr">');
  });
});

describe('renderTabs', () => {
  test('emits one anchor per locale with both labels', () => {
    const html = renderTabs('ru');
    expect(html).toContain('href="/ru/"');
    expect(html).toContain('Русский');
    expect(html).toContain('>RU<');
  });

  test('marks the active locale', () => {
    expect(renderTabs('ru')).toContain('aria-current="page"');
  });
});

describe('renderManual', () => {
  // Drawn from the manual itself, so a section dropped from render.ts fails here
  // without anyone retyping heading strings.
  const sectionsWithHeading = [
    manual.gettingStarted,
    manual.commands,
    manual.inline,
    manual.notation,
    manual.systems,
    manual.limits,
    manual.faq,
  ];

  test('renders every section heading', () => {
    const html = renderManual(manual, 'en');
    for (const section of sectionsWithHeading) {
      expect(html).toContain(section.heading);
    }
  });

  test('renders the footer labels', () => {
    const html = renderManual(manual, 'en');
    expect(html).toContain(manual.footer.playground);
    expect(html).toContain(manual.footer.reference);
    expect(html).toContain(manual.footer.source);
  });

  test('embeds generated replies verbatim', () => {
    const example = manual.commands.items[0].example;
    if (example == null) throw new Error('the first command is expected to carry an example');
    expect(renderManual(manual, 'en')).toContain(example.replyHtml);
  });

  test('quotes a named roll back into the typed line', () => {
    const named = resolveExamples({
      ...english,
      commands: {
        ...en.commands,
        items: [
          {
            command: 'roll',
            summary: 'Rolls.',
            example: { notation: '2d6+3', rng: [4, 6], mode: 'compact', label: 'Damage' },
          },
        ],
      },
    });
    const html = renderManual(named, 'en');
    expect(html).toContain('<code>/roll 2d6+3 &quot;Damage&quot;</code>');
    expect(html).toContain('<blockquote>Damage</blockquote>');
  });

  test('renders a command with no example without a reply bubble', () => {
    const bare = resolveExamples({
      ...english,
      commands: { ...en.commands, items: [{ command: 'help', summary: 'Notation guide.' }] },
      specialFeatures: { ...en.specialFeatures, items: [] },
      systems: { ...en.systems, items: [] },
    });
    const html = renderManual(bare, 'en');
    expect(html).toContain('<code>/help</code>');
    expect(html).not.toContain('class="example"');
  });

  test('heads an ask example with the command that produces it', () => {
    const html = renderManual(manual, 'en');
    expect(html).toContain('<code>/ask Should we open the door?</code>');
    expect(html).toContain('<blockquote>Should we open the door?</blockquote>');
  });

  test('heads a pick example with the command that produces it', () => {
    const html = renderManual(manual, 'en');
    expect(html).toContain('<code>/pick Goblin patrol | Empty room | Treasure hoard</code>');
    expect(html).toContain('<b>Empty room</b>');
  });

  test('shows a shorthand as typed and its reply as normalized', () => {
    const html = renderManual(manual, 'en');
    // `2к6` reaches the parser as `2d6`, so the caption and the reply differ.
    expect(html).toContain('<code>/roll 2к6</code>');
    expect(html).toContain('<code>2d6</code>');
  });

  test('renders command notes as a list', () => {
    expect(renderManual(manual, 'en')).toContain('<ul class="notes">');
  });

  test('renders the notation links as cards, not a trailing line', () => {
    const html = renderManual(manual, 'en');
    expect(html).toContain('<a class="link-card" href="https://roll-parser.edloidas.io/">');
    expect(html).not.toContain('class="out"');
  });

  test('escapes content but not generated reply markup', () => {
    const html = renderManual(manual, 'en');
    expect(html).not.toContain('<script');
  });

  test('links out to the roll-parser reference', () => {
    expect(renderManual(manual, 'en')).toContain('https://roll-parser.edloidas.io/reference');
  });
});

// Notation and bot output stay left-to-right in every locale; on /fa/ the
// neutral characters at their edges would otherwise be thrown across the run.
describe('renderManual bidi isolation', () => {
  const html = renderManual(fallenBack, 'fa');

  test('isolates the typed-input caption', () => {
    expect(html).toContain('<div class="example-in" dir="ltr">');
  });

  test('isolates the reply bubble', () => {
    expect(html).toContain('<div class="reply" dir="ltr">');
  });

  test('isolates the command heading, shortcut included', () => {
    expect(html).toContain('<h3 dir="ltr"><code>/roll</code>');
    expect(html).toContain('<span class="shortcut">/r</span>');
  });

  test('isolates every notation cell', () => {
    expect(html).toContain('<td><code dir="ltr">(1d6+2)*3</code></td>');
    expect(html).not.toContain('<td><code>');
  });

  test('leaves no caption or bubble unisolated', () => {
    expect(html).not.toContain('<div class="example-in">');
    expect(html).not.toContain('<div class="reply">');
  });
});

describe('renderManual fallback marks', () => {
  test('marks every section of an untranslated locale', () => {
    const html = renderManual(fallenBack, 'fa');
    expect(html).not.toContain('<section id="getting-started">');
    expect(html).toContain('<section id="getting-started" lang="en" dir="ltr">');
    expect(html).toContain('<section id="faq" lang="en" dir="ltr">');
    expect(html).toContain('<footer class="footer" lang="en" dir="ltr">');
  });

  test('leaves a translated locale unmarked section by section', () => {
    const html = renderManual(manual, 'en');
    expect(html).toContain('<section id="getting-started">');
    expect(html).toContain('<footer class="footer">');
    expect(html).not.toContain('lang="en"');
  });
});

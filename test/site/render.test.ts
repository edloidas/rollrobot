import { describe, expect, test } from 'bun:test';
import { resolveManual } from '../../site/content';
import { en } from '../../site/content/en';
import { renderHero, renderManual, renderTabs } from '../../site/src/render';
import { resolveExamples } from '../../site/src/replies';

const english = resolveManual('en');
const manual = resolveExamples(english);
/** Stands in for a locale with no translation at all — every section is English. */
const fallenBack = resolveExamples(resolveManual('fa'));

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
      systems: { ...en.systems, items: [] },
    });
    const html = renderManual(bare, 'en');
    expect(html).toContain('<code>/help</code>');
    expect(html).not.toContain('class="example"');
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

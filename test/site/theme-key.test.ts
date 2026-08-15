import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { THEME_CYCLE, THEME_KEY } from '../../site/src/theme-key';

// The pre-paint script runs before any module loads, so it is the one place the
// key cannot be imported. This gates it the way locales.test.ts gates the locale
// list — the literal is allowed to be spelled out, but not to drift.
const template = await Bun.file(
  join(import.meta.dir, '..', '..', 'site', 'index.template.html'),
).text();

describe('pre-paint theme script', () => {
  test('reads the same storage key the module writes', () => {
    expect(template).toContain(`localStorage.getItem('${THEME_KEY}')`);
  });

  test('accepts every stored mode the toggle can produce', () => {
    for (const mode of THEME_CYCLE) {
      // `auto` is the default the script falls back to, so it is never compared.
      if (mode === 'auto') continue;
      expect(template).toContain(`'${mode}'`);
    }
  });
});

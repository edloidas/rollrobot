const PLAYGROUND_URL = 'https://roll-parser.edloidas.io/';
const REFERENCE_URL = 'https://roll-parser.edloidas.io/reference';
const MANUAL_HOST = 'rollrobot.edloidas.io';

/** Link helpers keep the URLs in one place — every locale only translates the label. */
export function playground(label: string): string {
  return `<a href="${PLAYGROUND_URL}">${label}</a>`;
}

export function reference(label: string): string {
  return `<a href="${REFERENCE_URL}">${label}</a>`;
}

/**
 * The landing page for one locale, without a scheme. `setMyDescription` takes no entities,
 * so the bot description carries the URL bare and it has to read as one on its own.
 */
export function manualUrl(locale: string): string {
  return `${MANUAL_HOST}/${locale}/`;
}

/**
 * The guide line that opens `/help`. The ornament lives here rather than in eight
 * dictionaries so it cannot drift, and both marks are the same glyph on purpose: a
 * mirrored pair such as `»«` swaps ends in the right-to-left locale.
 */
export function manual(label: string, locale: string): string {
  return `◆ <a href="https://${manualUrl(locale)}">${label}</a> ◆`;
}

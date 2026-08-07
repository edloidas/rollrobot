const PLAYGROUND_URL = 'https://roll-parser.edloidas.io/';
const REFERENCE_URL = 'https://roll-parser.edloidas.io/reference';

/** Link helpers keep the URLs in one place — every locale only translates the label. */
export function playground(label: string): string {
  return `<a href="${PLAYGROUND_URL}">${label}</a>`;
}

export function reference(label: string): string {
  return `<a href="${REFERENCE_URL}">${label}</a>`;
}

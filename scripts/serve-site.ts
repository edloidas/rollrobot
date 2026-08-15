/**
 * Serves the built site from `site/dist/` for local review.
 *
 * Mirrors what Cloudflare Pages does for a static directory: a trailing slash
 * resolves to that directory's `index.html`, a bare directory path redirects to
 * the slashed form, anything else is a 404. Build first — this only serves.
 */

import { existsSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { DIST_DIR } from './site-manifest';

const PORT = Number(process.env.PORT ?? 4173);

if (!existsSync(DIST_DIR)) {
  console.error(`${DIST_DIR} does not exist — run \`bun run site:build\` first.`);
  process.exit(1);
}

/** Resolves a URL path inside `dist/`, or `null` if it would escape the root. */
function resolve(pathname: string): string | null {
  let decoded: string;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const target = normalize(join(DIST_DIR, decoded));

  return target === DIST_DIR || target.startsWith(DIST_DIR + sep) ? target : null;
}

function notFound(): Response {
  return new Response('Not found\n', { status: 404, headers: { 'content-type': 'text/plain' } });
}

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const target = resolve(pathname);

    if (target === null) return notFound();

    if (pathname.endsWith('/')) {
      const index = Bun.file(join(target, 'index.html'));

      return (await index.exists()) ? new Response(index) : notFound();
    }

    // ! Directory check first. Asking `Bun.file(target).exists()` before this
    // ! makes a bare `/en` depend on Bun answering false for a directory —
    // ! undocumented, and answering true would make this redirect unreachable.

    // Only the path changes: rebuilding the destination would drop the query, so
    // `/en?preview=1` would land on `/en/` with the flag gone.
    if (existsSync(join(target, 'index.html'))) {
      url.pathname = `${pathname}/`;

      return Response.redirect(url.href, 301);
    }

    const file = Bun.file(target);
    if (await file.exists()) return new Response(file);

    return notFound();
  },
});

console.log(`Serving ${DIST_DIR} → ${server.url}`);

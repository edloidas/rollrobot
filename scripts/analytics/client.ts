/** The Analytics Engine dataset this Worker writes to. */
export const DATASET = 'rollrobot_events';

/** Successful responses carry this envelope; failures carry anything else. */
interface SqlResponse<Row> {
  meta: { name: string; type: string }[];
  data: Row[];
  rows: number;
}

export interface AnalyticsClient {
  query<Row>(sql: string): Promise<Row[]>;
}

// Every response is parsed as the JSON envelope, so a caller-supplied FORMAT is
// replaced rather than honoured — accepting one would return a body this client
// cannot read. The API also rejects a trailing semicolon.
// The clause goes on its own line: appended inline it would land inside a trailing
// `-- comment` and be parsed as part of it.
function withFormat(sql: string): string {
  return `${sql
    .trim()
    .replace(/;\s*$/, '')
    .replace(/\s+FORMAT\s+\w+$/i, '')}\nFORMAT JSON`;
}

function requireEnv(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required${hint ? ` — ${hint}` : ''}`);
  }
  return value;
}

/**
 * Reads `CF_ACCOUNT_ID` and `CF_ANALYTICS_TOKEN` from the environment. These are
 * local credentials, never Worker secrets — nothing here runs in the Worker.
 */
export function createClient(): AnalyticsClient {
  const accountId = requireEnv('CF_ACCOUNT_ID');
  const token = requireEnv('CF_ANALYTICS_TOKEN', 'needs Account · Account Analytics · Read');
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;

  return {
    async query<Row>(sql: string): Promise<Row[]> {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: withFormat(sql),
      });

      const body = await response.text();

      let parsed: SqlResponse<Row> | undefined;
      try {
        parsed = JSON.parse(body);
      } catch {
        // Falls through to the error below — the API answers 4xx with plain text
      }

      if (parsed?.data == null) {
        throw new Error(`Query failed (${response.status}): ${body.trim().slice(0, 500)}`);
      }

      return parsed.data;
    },
  };
}

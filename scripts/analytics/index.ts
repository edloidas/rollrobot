import { parseArgs } from 'node:util';
import { type AnalyticsClient, createClient } from './client';
import { fetchLatestRows, fetchPointsPerDay } from './queries';
import { buildReport, preamble, renderReport } from './report';
import { RETENTION_DAYS, SNAPSHOT_DIR, writeSnapshots } from './snapshot';

const DEFAULT_DAYS = 30;

/** Free-plan write allowance, the ceiling the volume check is read against. */
const DAILY_ALLOWANCE = 100_000;

const USAGE = `Usage: bun run analytics [command] [options]

Commands:
  (default)          full report over the window
  doctor [n]         latest n rows plus write-path assertions (default 20)
  quota              data points per day against the ${DAILY_ALLOWANCE}/day allowance
  sql "SELECT ..."   run one query and print the rows (always FORMAT JSON)

Options:
  --days <n>         window in days (default ${DEFAULT_DAYS}, max ${RETENTION_DAYS})
  --json             emit JSON instead of tables
  --snapshot         freeze every complete day not yet in ${SNAPSHOT_DIR}/
`;

function print(json: boolean, value: unknown, text: () => string): void {
  console.log(json ? JSON.stringify(value, null, 2) : text());
}

/**
 * The caveats precede every run. Commands whose stdout is meant to be piped get
 * them on stderr instead, so the payload stays parseable.
 */
function printCaveats(json: boolean, stream: 'out' | 'err'): void {
  if (json) return;
  if (stream === 'out') console.log(`${preamble()}\n`);
  else console.error(`${preamble()}\n`);
}

async function runDoctor(client: AnalyticsClient, limit: number, json: boolean): Promise<void> {
  printCaveats(json, 'err');
  const rows = await fetchLatestRows(client, limit);
  if (rows.length === 0) {
    throw new Error(
      'No rows. Either nothing has been rolled since deploy, or the binding is missing.',
    );
  }

  const rollRows = rows.filter((row) => row.blob1 !== 'help' && row.blob1 !== 'start');
  const hashedRows = rows.filter((row) => /^[0-9a-f]{64}$/.test(row.blob5));
  const termRows = rollRows.filter((row) => /^\d+d(\d+|F)$/.test(row.blob2));
  const checks = [
    {
      name: 'blob5 user hash',
      // An empty digest means ANALYTICS_SALT never reached the Worker, and those
      // rows stay un-attributable — there is no backfill.
      ok: hashedRows.length === rows.length,
      detail: `${hashedRows.length}/${rows.length} rows carry a 64-char hex digest`,
    },
    {
      name: 'blob4 surface',
      ok: rows.some((row) => row.blob4 !== 'unknown' && row.blob4 !== ''),
      detail: [...new Set(rows.map((row) => row.blob4))].join(', '),
    },
    {
      name: 'blob2 dice term',
      ok: rollRows.length > 0 && termRows.length === rollRows.length,
      detail: `${termRows.length}/${rollRows.length} roll rows carry an NdX term`,
    },
  ];

  print(json, { rows, checks }, () =>
    [
      `latest ${rows.length} rows`,
      ...rows.map(
        (row) =>
          `  ${row.timestamp}  ${row.index1.padEnd(5)} ${row.blob1.padEnd(7)} ${(row.blob2 || '-').padEnd(8)} ${(row.blob3 || '-').padEnd(10)} ${row.blob4.padEnd(10)} ${row.blob5.slice(0, 10) || 'MISSING'} #${row.double1}`,
      ),
      '',
      ...checks.map((check) => `  ${check.ok ? 'PASS' : 'FAIL'}  ${check.name}: ${check.detail}`),
    ].join('\n'),
  );

  if (checks.some((check) => !check.ok)) process.exitCode = 1;
}

async function runQuota(client: AnalyticsClient, days: number, json: boolean): Promise<void> {
  printCaveats(json, 'out');
  const rows = await fetchPointsPerDay(client, days);
  const value = rows.map((row) => ({ ...row, share: row.n / DAILY_ALLOWANCE }));

  print(json, value, () =>
    [
      `data points per day (allowance ${DAILY_ALLOWANCE}/day)`,
      ...value.map(
        (row) => `  ${row.day}  ${String(row.n).padStart(8)}  ${(row.share * 100).toFixed(1)}%`,
      ),
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      days: { type: 'string' },
      json: { type: 'boolean', default: false },
      snapshot: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  const days = Math.min(Number(values.days ?? DEFAULT_DAYS), RETENTION_DAYS);
  if (!Number.isFinite(days) || days < 1) {
    throw new Error(`--days must be a positive number, got "${values.days}"`);
  }

  const client = createClient();
  const [command, argument] = positionals;

  if (values.snapshot) {
    if (command != null) {
      throw new Error(`--snapshot takes no command, but got "${command}"\n\n${USAGE}`);
    }

    printCaveats(values.json, 'err');
    const outcome = await writeSnapshots(client);
    print(values.json, outcome, () =>
      [
        `snapshots in ${SNAPSHOT_DIR}/`,
        `  wrote ${outcome.written.length}: ${outcome.written.join(' ') || '-'}`,
        `  already present: ${outcome.skipped.length}`,
        `  incomplete, not frozen: ${outcome.pending.join(' ') || '-'}`,
      ].join('\n'),
    );
    return;
  }

  switch (command) {
    case undefined: {
      const report = await buildReport(client, days);
      print(values.json, report, () => renderReport(report));
      return;
    }
    case 'doctor':
      return runDoctor(client, Number(argument ?? 20), values.json);
    case 'quota':
      return runQuota(client, days, values.json);
    case 'sql': {
      if (!argument) throw new Error('sql needs a query, e.g. analytics sql "SELECT 1"');
      printCaveats(values.json, 'err');
      console.log(JSON.stringify(await client.query(argument), null, 2));
      return;
    }
    default:
      throw new Error(`Unknown command "${command}"\n\n${USAGE}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

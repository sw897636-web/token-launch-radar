// Farm-plan consistency: the page's farmSteps (dashboard/app.js, top level) must
// produce, for every board row, the exact strings board.json carries (lib/model.ts).
// Run: node test/farm-consistency.mjs
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { farmSteps as modelSteps, stepText, parseSnapshot } from '../lib/model.ts';

const repo = new URL('..', import.meta.url).pathname;
const appJs = readFileSync(`${repo}dashboard/app.js`, 'utf8');
const board = JSON.parse(readFileSync(`${repo}out/board.json`, 'utf8'));
const snapshot = parseSnapshot(readFileSync(process.env.SNAPSHOT ?? '/home/hatch/workspace/makefun/kit/token-radar-01-kit/input/snapshot.json', 'utf8'));
const bySlug = new Map(snapshot.protocols.map((p) => [p.slug, p]));

// Load app.js in a sandbox with no window.RADAR, so its IIFE returns early and only
// the top-level farm functions remain.
const sandbox = { window: {}, document: { getElementById: () => null }, console };
runInNewContext(appJs, sandbox);
if (typeof sandbox.farmSteps !== 'function') throw new Error('app.js exposes no top-level farmSteps');

let checked = 0;
const bad = [];
for (const row of board.rows) {
  const p = bySlug.get(row.slug);
  const expected = modelSteps(p, row.age_days).map(stepText);
  const got = sandbox.farmSteps({ name: p.name, category: p.category, chains: p.chains, tvl_usd: p.tvl_usd, age_days: row.age_days });
  checked++;
  if (expected.length !== got.length) { bad.push(`${row.slug}: ${expected.length} vs ${got.length} steps`); continue; }
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== got[i]) bad.push(`${row.slug} step ${i + 1}:\n  board: ${expected[i]}\n  page:  ${got[i]}`);
  }
}
console.log(`farm consistency: ${checked} rows checked, ${bad.length} mismatches`);
if (bad.length > 0) { console.log(bad.slice(0, 6).join('\n')); process.exit(1); }
console.log('farm consistency: OK — every page farm step matches board.json verbatim');

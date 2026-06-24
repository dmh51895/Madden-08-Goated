#!/usr/bin/env node
/**
 * sync-player-ids
 * ---------------
 * Scans seed CSV files for player IDs and writes data/playerIds.json,
 * which app/player/[id]/page.jsx reads at build time via generateStaticParams.
 *
 * Default seed locations (any/all of these are scanned if present):
 *   data/seed/FinalAttributes.csv      (main NZA roster — "Player ID" column)
 *   data/seed/Rookies.csv              (rookie pool — "ID" column)
 *
 * Override / add by passing paths as args:
 *   npm run sync-player-ids -- path/to/extra.csv path/to/other.csv
 *
 * The script is non-fatal: if no seed files exist, it warns and leaves any
 * existing data/playerIds.json untouched (so `prebuild` never breaks `build`).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT  = resolve(ROOT, "data", "playerIds.json");

const DEFAULT_SEEDS = [
  resolve(ROOT, "data", "seed", "FinalAttributes.csv"),
  resolve(ROOT, "data", "seed", "Rookies.csv"),
];

// ── tiny RFC-4180-ish CSV reader (handles quoted fields with embedded commas) ──
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ",") { out.push(cur); cur = ""; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

function readCsvRows(path) {
  const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => { row[h] = (cells[j] ?? "").trim(); });
    rows.push(row);
  }
  return rows;
}

// Look in any of these column names (NZA uses "Player ID", rookies CSV uses "ID")
const ID_COLUMNS = ["Player ID", "PlayerID", "playerId", "ID", "id"];

function extractIds(rows, sourceLabel) {
  const ids = new Set();
  let col = null;
  if (rows.length) {
    const headerKeys = Object.keys(rows[0]);
    col = ID_COLUMNS.find((c) => headerKeys.includes(c));
  }
  if (!col) {
    console.warn(`  ⚠ ${sourceLabel}: no ID column found (looked for: ${ID_COLUMNS.join(", ")})`);
    return ids;
  }
  for (const row of rows) {
    const pid = (row[col] ?? "").trim();
    if (pid) ids.add(pid);
  }
  console.log(`  ✓ ${sourceLabel}: ${ids.size} IDs from "${col}"`);
  return ids;
}

// ── main ─────────────────────────────────────────────────────
const extraSeeds = process.argv.slice(2).map((p) => resolve(process.cwd(), p));
const candidates = [...DEFAULT_SEEDS, ...extraSeeds];
const existing = candidates.filter((p) => {
  try { return statSync(p).isFile(); } catch { return false; }
});

if (!existing.length) {
  console.warn("[sync-player-ids] No seed CSVs found — skipping.");
  console.warn("  Looked in:");
  candidates.forEach((p) => console.warn(`    - ${p}`));
  console.warn("  Drop FinalAttributes.csv / Rookies.csv into data/seed/ and re-run.");
  console.warn("  (Existing data/playerIds.json, if any, is unchanged.)");
  process.exit(0);
}

console.log("[sync-player-ids] Scanning seed files:");
const allIds = new Set();
for (const path of existing) {
  try {
    const rows = readCsvRows(path);
    const ids = extractIds(rows, basename(path));
    ids.forEach((id) => allIds.add(id));
  } catch (err) {
    console.error(`  ✗ ${basename(path)}: ${err.message}`);
  }
}

if (!allIds.size) {
  console.error("[sync-player-ids] No IDs extracted — bailing without overwriting playerIds.json.");
  process.exit(1);
}

// Sort numerically when possible, lexicographically otherwise.
const sorted = [...allIds].sort((a, b) => {
  const na = Number(a), nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a).localeCompare(String(b));
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(sorted) + "\n", "utf8");
console.log(`[sync-player-ids] Wrote ${sorted.length} IDs → ${OUT}`);

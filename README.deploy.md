# Madden 08 Goated — Cloudflare Pages deploy

## Build
- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Root directory:** `next-app` (or blank if deploying just this folder)

## Local dev
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → ./out
```

## What works (verified end-to-end against real data)

- ✅ NZA roster CSV parse (1,858 players, 131 columns)
- ✅ NZA roster export — round-trip preserves every column + applies all in-app edits
  (signings, position/jersey changes, renames flush back into the CSV)
- ✅ Colleges CSV (id → name mapping)
- ✅ Draft board rookies (177 rookies parsed from real file)
- ✅ Draft picks with multi-section "Round N" handling (125 picks parsed)
- ✅ Trade chart with 3-row banner header + Team (Owner) [Original] cell parsing
- ✅ Two-tier-header Player Stats / Team Stats CSV
- ✅ **Game log .txt upload** — parses the full fixed-width Madden 08 format
  (passing/rushing/receiving/defense/kicking/punting/returns/blocking) and
  aggregates per-player season totals automatically
- ✅ Stats counter excludes "Game was not completed" games
- ✅ Standings derived live from completed game logs
- ✅ Team management: sign / release / position change / jersey change
- ✅ **Duplicate name detector** (65 dupes found in the sample roster including
  Jake Scott × 3) with rename UI + auto-suggest (II, III, …)
- ✅ All edits round-trip through NZA export → can be re-uploaded to NZA editor
- ✅ URL routing: `/`, `/{panel}/`, `/roster/{team}/{year}/`, `/schedule/{team}/{year}/`
- ✅ `/Roster/.../` (capitalized, per original spec) → 301 → lowercase

## Routes
- `/`                            → app shell, Standings panel
- `/{panel}/`                    → 18 panels (incl. `/duplicates/`)
- `/roster/{team}/{year}/`       → 32 × 7 = 224 deep links
- `/schedule/{team}/{year}/`     → 32 × 7 = 224 deep links

## Verified workflow

1. Settings → upload Roster (NZA) CSV
2. Settings → upload Colleges, Draft Board, Draft Picks, Trade Chart as needed
3. Schedules → upload one or more game log `.txt` files (multi-select)
4. Stats auto-aggregate; standings derive from completed logs
5. Duplicates tab → resolve any duplicate names (suggested rename suffixes II/III)
6. Team Mgmt → sign / release / position / jersey
7. Settings → "Download roster CSV (NZA-compatible)" — gets your modified roster
   as a CSV you can re-import in the NZA editor.

State is per-season in browser localStorage. Switching seasons preserves prior
years' data automatically.

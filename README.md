# Madden-08-Goated — drop-in bundle (v3)

Drop-in paths in this zip mirror your repo's structure exactly.
Extract from your repo root — paths line up, files land where they belong.

## File inventory & destinations

```
components/AppShell.jsx        REPLACE  components/AppShell.jsx
components/HomePage.jsx        REPLACE  components/HomePage.jsx
components/PlayerPage.jsx      REPLACE  components/PlayerPage.jsx
components/TeamsPage.jsx       REPLACE  components/TeamsPage.jsx
components/InjuriesPage.jsx    REPLACE  components/InjuriesPage.jsx
data/csvParser.js              REPLACE  data/csvParser.js
data/teamColors.js             NEW      data/teamColors.js
data/portraits.js              NEW      data/portraits.js
data/playerIds.json            NEW      data/playerIds.json
scripts/sync-player-ids.mjs    NEW      scripts/sync-player-ids.mjs
app/player/[id]/page.jsx       NEW      app/player/[id]/page.jsx
package.json                   REPLACE  package.json
```

11 files total. Three folders need to exist that may not yet in your repo:
`scripts/`, `data/seed/` (optional — for the prebuild ID manifest source),
and `app/player/[id]/` (the literal `[id]` folder name, Next.js dynamic route syntax).

## Bring-up steps

1. Extract this zip from your repo root, accepting all overwrites.
2. (Optional but recommended) commit your reference CSVs to seed the
   player-ID manifest so prebuild can regenerate it:
   ```
   data/seed/FinalAttributes.csv      ← your 1858-player NZA roster
   data/seed/Rookies.csv              ← 2023_IML_Draft_Board__Rookies.csv
   ```
   If these don't exist, the prebuild hook warns and leaves the
   shipped `data/playerIds.json` untouched (build still succeeds).
3. `npm install` (no new deps).
4. `npm run build` — prebuild fires, regenerates the ID manifest if
   seeds exist, then Next prerenders ~2,330 static pages.

## What's in this bundle (full feature surface)

### Navigation
- **Back button** in the brand strip — top-left of every screen.
  Uses `window.history.back()`, so it's effectively the browser back
  button rendered inline. Works for any push that happens in-app
  (panel changes, deep links, player navigation).
- **Grouped dropdown nav** — HOME / LEAGUE ▾ / TEAMS ▾ / PLAYER /
  SCHEDULE / GAMECENTER / DRAFT ▾ / ADMIN ▾. Closed by outside-click,
  Escape, or selecting an item. Admin section is hidden unless your
  role is admin or moderator.
- **Player Prev / All Players / Next** — three-button row at the top of
  every player profile. Prev/Next navigate by player ID (numeric sort).
  All Players clears the selection and shows the lookup directory.

### Player profiles
- **Real shareable URLs:** `/player/12345/` for every player. 1,859
  pages prerendered at build time.
- **Tolerant lookup:** matches a player by ID, full name, OR Madden's
  abbreviated game-log name format ("Wa Pay" → Walter Payton).
- **Position-aware SEASON STATS:** separate tables per category
  (PASSING / RUSHING / RECEIVING / DEFENSE / KICKING / PUNTING /
  RETURNS / OL), each only rendering if the player has data there.
  Column labels are terse — section header gives context.
  - QB cards show RUSHING summary footer with TOTAL YDS/TDS combined
  - RB cards show RECEIVING summary footer with TOTAL YDS/TDS combined
  - Returner cards show KR and PR side-by-side
- **Team-colored profile header:** gradient from black → team brand
  color with team-colored jersey badge / portrait holder.
- **Portraits** — see below.

### Portraits (NEW in v3)
- **Per-player upload:** hover the jersey badge on any profile, click
  the 📷 button (or click the badge itself). Picks a single image and
  stores it. ✕ removes a stored portrait.
- **Bulk upload:** "📁 BULK UPLOAD PORTRAITS" button in the PLAYER
  LOOKUP view. Folder picker — scans every filename for an embedded
  numeric player ID and saves matching images. Naming patterns it
  understands:
  - `12345.jpg`
  - `12345_payton.png`
  - `p12345.webp`
  - `payton_walter_12345.jpg` (longest numeric run wins)
- **Storage:** images are stored as Blobs in a dedicated IndexedDB
  database (`pcft-portraits` → `portraits` object store) keyed by
  player ID. Separate from the main league data so the ~MB of binary
  doesn't slow down league reads/writes. Per-browser (no server
  sync) — every user uploads their own copies.
- **Render:** if a portrait exists for the active player, it replaces
  the jersey badge in the profile header. Otherwise the jersey number
  shows as before.

### Team identity
- **`data/teamColors.js`** — all 32 NFL team brand colors extracted
  from the original `madcat.css`, including legacy abbreviations
  (`OAK`→Raiders, `SD`→Chargers, `STL`→Rams).
- Applied to: TeamsPage banner header, HomePage GOTW + power
  rankings + standings strip, PlayerPage profile gradient + jersey
  badge, InjuriesPage row stripes, search dropdown rows.

### Injuries (genuinely working)
- **No more mock data.** Manual mark-as-injured UI for admin / mod /
  team-owner roles. Persisted in `localStorage` per season at
  `pcft.injuries.{year}`. Survives reloads, no franchise-file
  dependency.
- Two tabs: **ACTIVE INJURIES** (manually tracked, with status / body
  part / week / note) and **INJURY RISK** (sorted by Madden injury
  rating from the roster — real data).
- Five count cards across the top (Questionable / Doubtful / Out /
  IR / PUP), color-coded.

### Game log parsing (full aggregator)
- Every field the parser already extracted is now captured by
  `aggregateGameLogs`:
  - **PASSING:** rating (avg per QB game), completion %, sacks
    taken, longest pass
  - **RUSHING:** AVG (recomputed from totals), LONG (max), fumbles
  - **RECEIVING:** AVG, LONG, YAC, DROP %
  - **DEFENSE:** TFL, FF, FREC, safeties, catches allowed, big
    hits, deflections, TFL+SK+FF combined
  - **KICKING:** FG % / XP %, kickoffs, touchbacks, blocks
  - **PUNTING:** AVG, LONG, blocks, IN20, touchbacks
  - **RETURNS:** kick + punt return attempts/yards/avg/TD/long
  - **BLOCKING:** pancakes + sacks allowed
- Rate stats (PCT, AVG, RATING) are recomputed from raw totals —
  accurate season numbers, not averages of game-by-game averages.

### Build pipeline
- **`npm run sync-player-ids`** — pure Node script (no deps) that
  scans `data/seed/*.csv` for any of the column names `Player ID`,
  `PlayerID`, `playerId`, `ID`, `id`, dedupes, sorts numerically,
  writes `data/playerIds.json`.
- **`npm run prebuild`** — auto-fires before every `next build`,
  Cloudflare deploys regenerate the manifest each time. Non-fatal
  if seeds are absent.

## Bugs fixed across v1–v3 (consolidated)

1. **AppShell TDZ crash** — `newsImage`/`gotwImage` referenced
   `seasonData` ~40 lines before it was declared. Whole shell
   threw on render.
2. **STANDINGS routed to HomePage** — both `case "home"` and
   `case "standings"` fell through to HomePage. Standings panel
   was literally inaccessible.
3. **Player click → wrong player** — leaderboard rows have
   `playerName` but no `playerId`. PlayerPage looked up by ID,
   didn't match, fell back to `roster[0]`. Click McMahon → see
   Steve Fuller. Fixed via name-→ID resolution in
   `navigateToPlayer` + tolerant lookup in PlayerPage.
4. **InjuriesPage was mock data** — `Math.random()` + nonexistent
   field reads. Replaced with real persistence.
5. **ADMIN ▾ never appeared** — `isAdmin` check used string roles
   while `adminRoles.js` uses numeric constants. Fixed.
6. **Player tab remembered stale selection** — visiting PLAYER
   would show the last-clicked player instead of resetting.
   Fixed by clearing `selectedPlayer` whenever `panel !== "player"`.
7. **URL stayed on `/player/12345/` after navigating away** — the
   URL didn't sync to the new panel. Fixed by making the URL-sync
   effect aware of when you're on a deep route vs when you've
   moved past it.
8. **Game-log abbreviated names didn't resolve to roster players**
   — "Wa Pay" wouldn't find Walter Payton. Fixed with a
   fuzzy-match fallback after exact-match.

## What's still on the table (next iterations available)

- **StandingsPage AFC/NFC conference split** with real conference
  colors (`#B10002` red / `#013577` navy from madcat.css). Needs
  conference data either in the standings CSV or as a constant
  per-team mapping.
- **Position-by-position depth chart view** on TeamsPage.
- **3-column legacy homepage layout** matching the original
  `index_5_14_14.php` exactly (265/415/375 px columns: file
  center + schedule + shoutbox on left, news + forum + leaders
  center, GOTW + standings on right).
- **Trade / transactions log** — modern replacement for the
  original's forum-based trade-vote thread.
- **Coach pages** with team color treatment.
- **Standings → divisional grouping** with team logos when you
  ship a logo asset pack.

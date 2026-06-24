// ── CSV Parsing Utilities ──────────────────────────────────
import { TEAM_IDS, POSITION_IDS, HEIGHT_MAP, maddenWeightToDisplay, TEAM_IDS_BY_ABBR } from "./maddenIds";

// ── RFC-4180-ish CSV line splitter ─────────────────────────
// Handles "quoted, fields", escaped ""quotes"", and \r\n line endings.
function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.replace(/\r$/, "").trim());
}

// Split a CSV file body into logical rows, respecting quoted newlines.
function splitCSVRows(csvText) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (ch === '"') {
      if (inQuotes && csvText[i + 1] === '"') { cur += '""'; i++; continue; }
      inQuotes = !inQuotes;
      cur += ch;
    } else if (ch === "\n" && !inQuotes) {
      rows.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length) rows.push(cur);
  return rows.filter((r) => r.replace(/[\s,]/g, "").length > 0);
}

// Parse a CSV string into array of row-objects using the first line as headers.
// headerRowIndex (default 0) lets callers skip banner rows.
export function parseCSV(csvText, headerRowIndex = 0) {
  const rawRows = splitCSVRows(csvText);
  if (rawRows.length <= headerRowIndex + 1) return [];

  const headers = splitCSVLine(rawRows[headerRowIndex]);
  const out = [];
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const cells = splitCSVLine(rawRows[i]);
    const row = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = cells[h] !== undefined ? cells[h] : "";
    }
    out.push(row);
  }
  return out;
}

// Small helper — first non-empty value among header aliases.
function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}
function pickInt(row, ...keys) {
  const v = pick(row, ...keys);
  const n = parseInt(v);
  return Number.isFinite(n) ? n : 0;
}
function pickFloat(row, ...keys) {
  const v = pick(row, ...keys);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// ── NZA Editor roster export ───────────────────────────────
// The file's header row contains the human-readable column names
// ("First Name", "Last Name", "Player ID", "Team ID", "Position ID", etc.).
// We store the entire raw row on each player object as `__raw` so changes
// (signings, position changes, jersey numbers, camp upgrades, renames) can be
// flushed back into a valid NZA CSV via `exportNzaroster`.
const NZA_EDITABLE_HEADERS = [];
export function parseNzaroster(csvText) {
  const rawRows = splitCSVRows(csvText);
  if (rawRows.length < 2) return [];
  const headers = splitCSVLine(rawRows[0]);
  // Cache headers on the module-level array so export can rebuild a matching CSV.
  NZA_EDITABLE_HEADERS.length = 0;
  headers.forEach((h) => NZA_EDITABLE_HEADERS.push(h));

  const raw = parseCSV(csvText);
  return raw.map((row) => {
    const posId = pickInt(row, "Position ID");
    const teamId = pickInt(row, "Team ID") || 1009;
    const heightVal = pickInt(row, "Height") || 72;
    const weightVal = pickInt(row, "Weight");

    return {
      playerId: pick(row, "Player ID"),
      teamId,
      positionId: posId,
      originalPositionId: pickInt(row, "Original Position ID") || posId,
      collegeId: pickInt(row, "College ID"),

      firstName: pick(row, "First Name"),
      lastName: pick(row, "Last Name"),

      height: heightVal,
      heightDisplay: HEIGHT_MAP[heightVal] || `${Math.floor(heightVal / 12)}'${heightVal % 12}"`,
      weight: maddenWeightToDisplay(weightVal),
      age: pickInt(row, "Age") || 22,
      jerseyNumber: pickInt(row, "Jersey #"),
      yearsPro: pickInt(row, "Years Pro"),

      // Ratings
      overall: pickInt(row, "Overall Rating"),
      speed: pickInt(row, "Speed"),
      acceleration: pickInt(row, "Acceleration"),
      agility: pickInt(row, "Agility"),
      strength: pickInt(row, "Strength"),
      awareness: pickInt(row, "Awareness"),
      stamina: pickInt(row, "Stamina"),
      injury: pickInt(row, "Injury"),
      toughness: pickInt(row, "Toughness"),

      throwPower: pickInt(row, "Throw Power"),
      throwAccuracy: pickInt(row, "Throw Accuracy"),

      carry: pickInt(row, "Carry"),
      catch: pickInt(row, "Catch"),
      jump: pickInt(row, "Jump"),
      breakTackle: pickInt(row, "Break Tackle"),
      kickReturn: pickInt(row, "Kick Return"),

      passBlock: pickInt(row, "Pass Block"),
      runBlock: pickInt(row, "Run Block"),

      tackle: pickInt(row, "Tackle"),

      kickAccuracy: pickInt(row, "Kick Accuracy"),
      kickPower: pickInt(row, "Kick Power"),

      teamAbbr: TEAM_IDS[teamId]?.abbr || "FA",
      positionAbbr: POSITION_IDS[posId]?.abbr || "QB",
      positionGroup: POSITION_IDS[posId]?.group || "QB",

      // Snapshot the raw CSV row so export can preserve every column we don't touch.
      __raw: { ...row },
    };
  });
}

// Map of modern player fields → original NZA header. Used on export to flush
// edits back into the raw row before serializing.
const MODERN_TO_NZA = {
  firstName: "First Name",
  lastName: "Last Name",
  playerId: "Player ID",
  teamId: "Team ID",
  positionId: "Position ID",
  collegeId: "College ID",
  height: "Height",
  weight: "Weight",
  age: "Age",
  jerseyNumber: "Jersey #",
  yearsPro: "Years Pro",
  overall: "Overall Rating",
  speed: "Speed",
  acceleration: "Acceleration",
  agility: "Agility",
  strength: "Strength",
  awareness: "Awareness",
  stamina: "Stamina",
  injury: "Injury",
  toughness: "Toughness",
  throwPower: "Throw Power",
  throwAccuracy: "Throw Accuracy",
  carry: "Carry",
  catch: "Catch",
  jump: "Jump",
  breakTackle: "Break Tackle",
  kickReturn: "Kick Return",
  passBlock: "Pass Block",
  runBlock: "Run Block",
  tackle: "Tackle",
  kickAccuracy: "Kick Accuracy",
  kickPower: "Kick Power",
};

// Build a CSV string that mirrors the original NZA editor export, with all
// in-app edits applied. If a player was added (no __raw), we fill its row by
// the same key map so the file remains valid for NZA re-import.
export function exportNzaroster(players, headers = NZA_EDITABLE_HEADERS) {
  if (!headers || !headers.length) {
    // Fallback header list — minimal but valid. Use only if parse never ran
    // (e.g. a fresh app session without a prior upload).
    headers = Object.values(MODERN_TO_NZA);
  }
  // For weight: in-app we display actual lbs (madden + 160). Convert back.
  const toStored = (p) => {
    const row = { ...(p.__raw || {}) };
    Object.entries(MODERN_TO_NZA).forEach(([modern, header]) => {
      if (p[modern] === undefined) return;
      let v = p[modern];
      if (modern === "weight") v = displayWeightToMadden(v); // stored = display - 160
      row[header] = v;
    });
    return row;
  };

  const rows = players.map(toStored);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  });
  return lines.join("\r\n");
}

// We need displayWeightToMadden here without circular import gymnastics —
// re-export the helper that maddenIds defines.
function displayWeightToMadden(actual) { return actual - 160; }

// ── Colleges map ───────────────────────────────────────────
// File: "College,College ID" → { id: name }
export function parseColleges(csvText) {
  const raw = parseCSV(csvText);
  const colleges = {};
  raw.forEach((row) => {
    const name = pick(row, "College", "Name");
    const id = pickInt(row, "College ID", "ID");
    if (id && name) colleges[id] = name;
  });
  return colleges;
}

// ── Rookie draft board ─────────────────────────────────────
// File header: Name,Pos,ID,PFRV,Ht,Wt,Awr,Spd,Str,Agi,Acc,Tak,Jmp,Cth,
//              Car,Btk,Thp,Tha,Pbl,Rbl,Kpw,Kac,KR,Sta,College,FINAL SORT,
//              PSXP (?),College ID,Jersey #,Skin Color ID,Tendency,Round drafted,Injury
export function parseDraftBoard(csvText) {
  const raw = parseCSV(csvText);
  return raw
    .map((row, i) => {
      const fullName = pick(row, "Name", "Player");
      const [firstName, ...rest] = fullName.split(" ");
      const heightStr = pick(row, "Ht", "Height"); // e.g. 6'3"
      const m = heightStr.match(/(\d+)'(\d+)/);
      const heightIn = m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 0;

      return {
        id: i + 1,
        name: fullName,
        firstName: firstName || "",
        lastName: rest.join(" "),
        position: pick(row, "Pos", "Position"),
        college: pick(row, "College"),
        collegeId: pickInt(row, "College ID"),
        overall: pickInt(row, "PFRV", "OVR", "Overall"),
        round: pickInt(row, "Round drafted", "Round"),
        pick: pickInt(row, "Pick"),
        height: heightIn,
        heightDisplay: heightStr,
        weight: pickInt(row, "Wt", "Weight"),
        speed: pickInt(row, "Spd"),
        strength: pickInt(row, "Str"),
        agility: pickInt(row, "Agi"),
        acceleration: pickInt(row, "Acc"),
        awareness: pickInt(row, "Awr"),
        injury: pickInt(row, "Injury"),
        tendency: pickInt(row, "Tendency"),
        jerseyNumber: pickInt(row, "Jersey #"),
      };
    })
    .filter((p) => p.name); // drop blank rows
}

// ── Draft picks board ──────────────────────────────────────
// Multi-section format:
//   Round 1,,,,
//   ,Pk,Team,Pos,Player
//   ,1,Redskins (Brittney) [MIA],QB,C.J. Stroud
//   ...
//   Round 2,,,,
//   ,Pk,Team,Pos,Player
//   ,34,...
//
// Team cell formatted "Owner (CurrentTeam) [OriginalTeam]" — parse all three.
const TEAM_CELL_RE = /^([^(\[]+?)\s*(?:\(([^)]+)\))?\s*(?:\[([^\]]+)\])?\s*$/;
function parseTeamCell(cell) {
  if (!cell) return { team: "", owner: "", originalTeam: "" };
  const m = cell.match(TEAM_CELL_RE);
  if (!m) return { team: cell.trim(), owner: "", originalTeam: "" };
  return {
    team: (m[1] || "").trim(),
    owner: (m[2] || "").trim(),
    originalTeam: (m[3] || "").trim(),
  };
}

export function parseDraftPicks(csvText) {
  const rows = splitCSVRows(csvText).map(splitCSVLine);
  const picks = [];
  let currentRound = 0;
  let colMap = null;

  for (const cells of rows) {
    if (!cells.length) continue;
    const joined = cells.join("").trim();
    if (!joined) continue;

    // Section header like "Round 1"
    const roundMatch = cells[0].match(/^Round\s+(\d+)/i);
    if (roundMatch) {
      currentRound = parseInt(roundMatch[1]);
      colMap = null;
      continue;
    }

    // Column header row inside a section ("," Pk Team Pos Player)
    const headerCandidate = cells.map((c) => c.toLowerCase());
    if (headerCandidate.includes("pk") && headerCandidate.includes("team")) {
      colMap = {
        pick: headerCandidate.indexOf("pk"),
        team: headerCandidate.indexOf("team"),
        pos: headerCandidate.indexOf("pos"),
        player: headerCandidate.indexOf("player"),
      };
      continue;
    }
    if (!colMap) continue;

    const pkRaw = cells[colMap.pick];
    if (!pkRaw || !/^\d+$/.test(pkRaw)) continue;

    const teamInfo = parseTeamCell(cells[colMap.team] || "");
    picks.push({
      id: picks.length + 1,
      round: currentRound,
      pick: parseInt(pkRaw),
      team: teamInfo.team,
      owner: teamInfo.owner,
      originalTeam: teamInfo.originalTeam,
      position: cells[colMap.pos] || "",
      player: cells[colMap.player] || "",
    });
  }
  return picks;
}

// ── Trade chart ────────────────────────────────────────────
// Structure (3 banner rows, then data):
//   IML Trade Chart,,,,,,,,,,,
//   ,,,,2023,,,,2024,,,
//   ,Pick,Pick,Team,1st,2nd,3rd,4th,1st,2nd,3rd,4th
//   ,1,1,Dolphins (MIA),Redskins (Brittney) [MIA],,,,,,...
export function parseTradeChart(csvText) {
  const rows = splitCSVRows(csvText).map(splitCSVLine);
  // Find the column header row: contains "Pick" and "Team" and at least one "1st"
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const lower = rows[i].map((c) => c.toLowerCase());
    if (lower.includes("pick") && lower.includes("team") && lower.includes("1st")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const yearRow = headerIdx > 0 ? rows[headerIdx - 1] : [];
  const headers = rows[headerIdx];

  // Identify the per-round columns. Two blocks of "1st 2nd 3rd 4th".
  const roundCols = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (/^(1st|2nd|3rd|4th|5th|6th|7th)$/.test(h)) {
      roundCols.push({ idx: i, label: h, year: yearRow[i] || "" });
    }
  }
  // Split into "current" (first 4) and "future" (rest).
  const current = roundCols.slice(0, 4);
  const future = roundCols.slice(4);

  const teamIdx = headers.findIndex((h) => h.toLowerCase() === "team");
  const pickIdxs = headers
    .map((h, i) => (h.toLowerCase() === "pick" ? i : -1))
    .filter((i) => i >= 0);

  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells.length) continue;
    const teamInfo = parseTeamCell(cells[teamIdx] || "");
    if (!teamInfo.team && !cells[pickIdxs[0]]) continue;

    const r = {
      id: out.length + 1,
      pickInRound: pickIdxs[0] !== undefined ? parseInt(cells[pickIdxs[0]]) || 0 : 0,
      overallPick: pickIdxs[1] !== undefined ? parseInt(cells[pickIdxs[1]]) || 0 : 0,
      originalTeam: teamInfo.team,
      originalTeamCell: cells[teamIdx] || "",
    };
    current.forEach((c, idx) => {
      const parsed = parseTeamCell(cells[c.idx] || "");
      r[`round${idx + 1}`] = parsed.team;
      r[`round${idx + 1}Owner`] = parsed.owner;
      r[`round${idx + 1}Original`] = parsed.originalTeam;
      r[`round${idx + 1}Raw`] = cells[c.idx] || "";
    });
    future.forEach((c, idx) => {
      const parsed = parseTeamCell(cells[c.idx] || "");
      r[`future${idx + 1}`] = parsed.team;
      r[`future${idx + 1}Owner`] = parsed.owner;
      r[`future${idx + 1}Raw`] = cells[c.idx] || "";
    });
    out.push(r);
  }
  return out;
}

// ── Player stats ───────────────────────────────────────────
// Two-row header: category banner above, real column names below.
// Real column row contains "Player" twice (first is name, second appears under PASSING).
// We use the SECOND row as the data header but uniquify names like CMP, ATT, YDS where
// they repeat by suffixing the category from row 1.
export function parsePlayerStats(csvText) {
  const rows = splitCSVRows(csvText).map(splitCSVLine);
  if (rows.length < 3) return [];

  const categoryRow = rows[0];
  const headerRow = rows[1];

  // Forward-fill the category row (Excel-style merged cells).
  const cats = [];
  let last = "";
  for (let i = 0; i < headerRow.length; i++) {
    if (categoryRow[i] && categoryRow[i].trim()) last = categoryRow[i].trim();
    cats[i] = last;
  }

  // Build unique field names: e.g. "YDS" inside "PASSING" → "PASSING_YDS".
  const seen = {};
  const fieldNames = headerRow.map((h, i) => {
    const base = (h || `col${i}`).trim();
    const cat = cats[i] && cats[i] !== base ? cats[i] : "";
    let name = cat ? `${cat}_${base}` : base;
    seen[name] = (seen[name] || 0) + 1;
    if (seen[name] > 1) name += `_${seen[name]}`;
    return name;
  });

  const stats = [];
  for (let i = 2; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells.length || !cells.some((c) => c)) continue;
    const row = {};
    fieldNames.forEach((n, idx) => { row[n] = cells[idx] !== undefined ? cells[idx] : ""; });

    // Convenience normalized fields the UI uses today.
    const pos = row.POS || row.Pos || "";
    const team = row.Team || row.TEAM || "";
    const playerName =
      row.Player ||
      row.Player_2 ||
      Object.entries(row).find(([k, v]) => /^player$/i.test(k))?.[1] ||
      "";

    stats.push({
      ...row,
      playerName,
      team,
      position: pos,
      gamesPlayed: parseInt(row.G || row.GP || row.Games || "0") || 0,
      passAttempts: parseInt(row.PASSING_ATT || row["Pass Att"] || "0") || 0,
      passCompletions: parseInt(row.PASSING_CMP || row["Pass Comp"] || row.CMP || "0") || 0,
      passYards: parseInt(row.PASSING_YDS || row["Pass Yds"] || "0") || 0,
      passTD: parseInt(row.PASSING_TD || row["Pass TD"] || "0") || 0,
      interceptions: parseInt(row.PASSING_INT || row.INT || "0") || 0,
      rushAttempts: parseInt(row.RUSHING_ATT || row["Rush Att"] || "0") || 0,
      rushYards: parseInt(row.RUSHING_YDS || row["Rush Yds"] || "0") || 0,
      rushTD: parseInt(row.RUSHING_TD || row["Rush TD"] || "0") || 0,
      receptions: parseInt(row.RECEIVING_REC || row.REC || "0") || 0,
      recYards: parseInt(row.RECEIVING_YDS || row["Rec Yds"] || "0") || 0,
      recTD: parseInt(row.RECEIVING_TD || row["Rec TD"] || "0") || 0,
      tackles: parseInt(row.DEFENSE_TOT || row.Tack || row.Tkl || "0") || 0,
      sacks: parseFloat(row.DEFENSE_SACK || row.Sacks || "0") || 0,
      defensiveInterceptions: parseInt(row.DEFENSE_INT || row["Int Def"] || "0") || 0,
      forcedFumbles: parseInt(row.DEFENSE_FF || row.FF || "0") || 0,
      fumbleRecoveries: parseInt(row.DEFENSE_FREC || row.FR || "0") || 0,
      fgMade: parseInt(row.KICKING_FGM || row["FG Made"] || "0") || 0,
      fgAttempts: parseInt(row.KICKING_FGA || row["FG Att"] || "0") || 0,
      xpMade: parseInt(row.KICKING_XPM || row["XP Made"] || "0") || 0,
      xpAttempts: parseInt(row.KICKING_XPA || row["XP Att"] || "0") || 0,
      kickReturnYards: parseInt(row["KICK RETURNING_YDS"] || row["KR Yds"] || "0") || 0,
      puntReturnYards: parseInt(row["PUNT RETURNING_YDS"] || row["PR Yds"] || "0") || 0,
    });
  }
  return stats.filter((s) => s.playerName);
}

// ── Team stats ─────────────────────────────────────────────
// Two-row header: category (Offense/Defense), then column names.
export function parseTeamStats(csvText) {
  const rows = splitCSVRows(csvText).map(splitCSVLine);
  if (rows.length < 3) return [];

  const categoryRow = rows[0];
  const headerRow = rows[1];

  const cats = [];
  let last = "";
  for (let i = 0; i < headerRow.length; i++) {
    if (categoryRow[i] && categoryRow[i].trim()) last = categoryRow[i].trim();
    cats[i] = last;
  }

  const seen = {};
  const fieldNames = headerRow.map((h, i) => {
    const base = (h || `col${i}`).trim();
    const cat = cats[i] && cats[i] !== base ? cats[i] : "";
    let name = cat ? `${cat}_${base}` : base;
    seen[name] = (seen[name] || 0) + 1;
    if (seen[name] > 1) name += `_${seen[name]}`;
    return name;
  });

  const out = [];
  for (let i = 2; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells.length || !cells.some((c) => c)) continue;
    const row = {};
    fieldNames.forEach((n, idx) => { row[n] = cells[idx] !== undefined ? cells[idx] : ""; });

    out.push({
      ...row,
      team: row.Team || row.TEAM || "",
      games: parseInt(row.Games || "0") || 0,
      passingYards: parseInt(row["Offense_Passing Yards"] || row["Passing Yards"] || "0") || 0,
      rushingYards: parseInt(row["Offense_Rushing Yards"] || row["Rushing Yards"] || "0") || 0,
      totalOffense: parseInt(row["Offense_TOTAL OFFENSE"] || row["TOTAL OFFENSE"] || "0") || 0,
      turnovers: parseInt(row.Offense_Turnovers || row.Turnovers || "0") || 0,
      timeOfPossession: row["Offense_TIME OF POSSESSION"] || row.TOP || "",
    });
  }
  return out.filter((t) => t.team);
}

// ── Standings ──────────────────────────────────────────────
// The "Standings Input" file is a raw game log dump, not a standings table.
// If a real standings CSV (Team,W,L,T,PF,PA,...) is uploaded, parse that;
// otherwise return [] and let the app derive standings from team stats / schedule.
export function parseStandings(csvText) {
  const raw = parseCSV(csvText);
  if (!raw.length) return [];
  // Only treat as standings if a W column is present.
  const sample = raw[0];
  if (!("W" in sample) && !("Wins" in sample)) return [];

  return raw
    .map((row) => ({
      team: pick(row, "Team", "Tm"),
      abbr: pick(row, "Team", "Tm"),
      w: pickInt(row, "W", "Wins"),
      l: pickInt(row, "L", "Losses"),
      t: pickInt(row, "T", "Ties"),
      pf: pickInt(row, "PF", "Points For"),
      pa: pickInt(row, "PA", "Points Against"),
      diff: pickInt(row, "PF") - pickInt(row, "PA"),
      conference: pick(row, "Conf", "Conference"),
      division: pick(row, "Div", "Division"),
    }))
    .filter((s) => s.team);
}

// ── Game stats (Madden 08 .txt game log) ───────────────────
// Real parser for the Madden 08 PC v4.0 game log format.
// Output shape:
//   {
//     filename, away, home, year, awayScore, homeScore, completed,
//     quarters: { away: [...5], home: [...5] },   // Q1 Q2 Q3 Q4 OT
//     teamStats: { away: {...}, home: {...} },
//     teams: {
//       [teamName]: {
//         passing: [ {name, CMP, ATT, YDS, ...}, ... ],
//         rushing: [...], receiving: [...], kicking: [...],
//         punting: [...], kickReturns: [...], puntReturns: [...],
//         defense: [...], blocking: [...],
//       }
//     }
//   }
// Fixed schemas — the Madden 08 game log uses tight header spacing
// ("YPA SACK", "INT LONG RATING") that breaks any whitespace-based header
// detection. Hardcoding is more reliable.
const SECTION_SCHEMAS = {
  PASSING:        ["CMP", "ATT", "YDS", "PCT", "YPA", "SACK", "TD", "INT", "LONG", "RATING"],
  RUSHING:        ["ATT", "YDS", "AVG", "LONG", "TD", "FUM"],
  RECEIVING:      ["REC", "YDS", "AVG", "LONG", "TD", "DROP", "YAC"],
  KICKING:        ["FGM", "FGA", "FG_PCT", "FGSBLOCKED", "XPA", "XPM", "XP_PCT", "XPSBLOCKED", "KICKOFFS", "TOUCHBACKS"],
  PUNTING:        ["ATT", "YDS", "AVG", "LONG", "BLOCKS", "IN20", "TOUCHBACKS"],
  "KICK RETURNS": ["ATT", "YDS", "AVG", "TD", "LONG"],
  "PUNT RETURNS": ["ATT", "YDS", "AVG", "LONG", "TD"],
  DEFENSE:        ["TOT", "LOSS", "SACK", "FF", "FREC", "YDS", "TD", "INT", "RET", "AVG", "DEFLECTIONS", "SAFETIES", "CTH ALLOW", "BIG HITS"],
  BLOCKING:       ["PANCAKES", "SACKS ALLOWED"],
};
const SECTION_NAMES = {
  PASSING: "passing", RUSHING: "rushing", RECEIVING: "receiving",
  KICKING: "kicking", PUNTING: "punting",
  "KICK RETURNS": "kickReturns", "PUNT RETURNS": "puntReturns",
  DEFENSE: "defense", BLOCKING: "blocking",
};

function splitFixedWidth(line) {
  return line.trim().split(/\s{2,}/);
}

function toNum(v) {
  if (v === undefined || v === null || v === "") return 0;
  const s = String(v).replace("%", "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function parseGameLog(text, filename = "") {
  const lines = text.split(/\r?\n/);

  // ── Header info ───────────────────────────────────────────
  const titleLine = lines.find((l) => l.includes("Game Log -"));
  let away = "", home = "";
  if (titleLine) {
    const m = titleLine.match(/Game Log -\s*(.+?)\s+at\s+(.+?)\s*$/);
    if (m) { away = m[1].trim(); home = m[2].trim(); }
  }
  // Body year takes precedence; fall back to filename if missing.
  const timeLine = lines.find((l) => l.startsWith("Game Time:"));
  let year = 0;
  if (timeLine) {
    const ym = timeLine.match(/(\d{4})\s*$/);
    if (ym) year = parseInt(ym[1]);
  }
  if (!year) {
    const fm = filename.match(/(\d{4})\.txt$/);
    if (fm) year = parseInt(fm[1]);
  }
  const completed = !lines.some((l) => /Game was not completed/i.test(l));

  // ── Quarter / final scores ────────────────────────────────
  // Header row: "Team               Q1   Q2   Q3   Q4   OT      FINAL"
  // Following two non-blank lines are the two teams.
  const quarters = { away: [0,0,0,0,0], home: [0,0,0,0,0] };
  let awayScore = 0, homeScore = 0;
  const teamHdr = lines.findIndex((l) => /^Team\s+Q1\s+Q2/.test(l));
  if (teamHdr !== -1) {
    const teamRows = [];
    for (let i = teamHdr + 1; i < lines.length && teamRows.length < 2; i++) {
      if (lines[i].trim()) teamRows.push(lines[i]);
    }
    if (teamRows.length === 2) {
      const a = splitFixedWidth(teamRows[0]); // [name, Q1, Q2, Q3, Q4, OT, FINAL]
      const h = splitFixedWidth(teamRows[1]);
      if (a.length >= 7 && h.length >= 7) {
        quarters.away = a.slice(1, 6).map(toNum);
        quarters.home = h.slice(1, 6).map(toNum);
        awayScore = toNum(a[6]);
        homeScore = toNum(h[6]);
      }
    }
  }

  // ── Team statistics block ─────────────────────────────────
  // "Game Statistics:                    Bills      Bears"
  // Followed by stat lines until "TIME OF POSSESSION"
  const teamStats = { away: {}, home: {} };
  const tsStart = lines.findIndex((l) => /^Game Statistics:/.test(l));
  if (tsStart !== -1) {
    for (let i = tsStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) break;
      if (line.startsWith("Individual Stats:")) break;
      const parts = splitFixedWidth(line);
      if (parts.length >= 3) {
        const stat = parts[0];
        teamStats.away[stat] = parts[parts.length - 2];
        teamStats.home[stat] = parts[parts.length - 1];
      }
      if (/^TIME OF POSSESSION/.test(line)) break;
    }
  }

  // ── Individual stats by team ──────────────────────────────
  const teams = {};
  const teamSectionIdxs = [];
  lines.forEach((l, i) => {
    if (l.startsWith("Individual Stats:")) {
      teamSectionIdxs.push({ idx: i, team: l.replace("Individual Stats:", "").trim() });
    }
  });
  // Slice each team block.
  for (let t = 0; t < teamSectionIdxs.length; t++) {
    const startIdx = teamSectionIdxs[t].idx;
    const endIdx = teamSectionIdxs[t + 1] ? teamSectionIdxs[t + 1].idx : lines.length;
    const team = teamSectionIdxs[t].team;
    const block = lines.slice(startIdx + 1, endIdx);
    teams[team] = parseTeamBlock(block);
  }

  return {
    filename,
    away,
    home,
    year,
    awayScore,
    homeScore,
    completed,
    quarters,
    teamStats,
    teams,
  };
}

function parseTeamBlock(blockLines) {
  const out = {
    passing: [], rushing: [], receiving: [], kicking: [], punting: [],
    kickReturns: [], puntReturns: [], defense: [], blocking: [],
  };

  const isJunk = (line) => {
    const t = line.trim();
    if (!t) return true;
    if (t === "No stats.") return true;
    if (t === "Game Log Ends") return true;
    if (/^-{3,}/.test(t)) return true;
    return false;
  };

  let i = 0;
  while (i < blockLines.length) {
    const line = blockLines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const sectionMatch = Object.keys(SECTION_SCHEMAS).find((name) =>
      trimmed === name || trimmed.startsWith(name + " ")
    );
    if (!sectionMatch) { i++; continue; }

    const sectionKey = SECTION_NAMES[sectionMatch];
    const schema = SECTION_SCHEMAS[sectionMatch];
    i++;

    while (i < blockLines.length) {
      const row = blockLines[i];
      const rowTrimmed = row.trim();
      if (isJunk(row)) { i++; if (!rowTrimmed) break; continue; }
      if (Object.keys(SECTION_SCHEMAS).some((n) => rowTrimmed === n || rowTrimmed.startsWith(n + " "))) break;
      if (rowTrimmed.startsWith("Individual Stats:")) break;

      const cells = splitFixedWidth(row);
      // A valid player row must have a name AND at least one numeric stat.
      if (cells.length < 2 || cells.slice(1).every((c) => isNaN(parseFloat(c)))) {
        i++;
        continue;
      }

      const entry = { name: cells[0] };
      schema.forEach((field, idx) => {
        const raw = cells[1 + idx];
        if (raw === undefined) { entry[field] = 0; return; }
        const numeric = toNum(raw);
        entry[field] = String(raw).includes("%") ? numeric : (isNaN(parseFloat(raw)) ? raw : numeric);
      });
      out[sectionKey].push(entry);
      i++;
    }
  }

  return out;
}

// Aggregate parsed game logs into per-player season stat totals.
// Returns an array shaped like parsePlayerStats output, so the LeadersPage
// "uploaded stats" branch picks it up without any other code changes.
export function aggregateGameLogs(logs) {
  const players = {};
  const ensure = (team, name) => {
    const key = `${team}::${name}`;
    if (!players[key]) {
      players[key] = {
        playerName: name, team, position: "",
        gamesPlayed: 0,
        // PASSING
        passAttempts: 0, passCompletions: 0, passYards: 0, passTD: 0,
        interceptions: 0, sacksTaken: 0, passLong: 0,
        _passRatingSum: 0, _passRatingGames: 0,  // for averaging passer rating
        // RUSHING
        rushAttempts: 0, rushYards: 0, rushTD: 0, fumbles: 0, rushLong: 0,
        // RECEIVING
        receptions: 0, recYards: 0, recTD: 0, drops: 0, yac: 0, recLong: 0,
        // DEFENSE
        tackles: 0, tacklesForLoss: 0, sacks: 0,
        defensiveInterceptions: 0, intReturnYards: 0, intReturnTD: 0,
        forcedFumbles: 0, fumbleRecoveries: 0, fumbleRecTD: 0,
        deflections: 0, safeties: 0, catchesAllowed: 0, bigHits: 0,
        // KICKING
        fgMade: 0, fgAttempts: 0, fgsBlocked: 0,
        xpMade: 0, xpAttempts: 0, xpsBlocked: 0,
        kickoffs: 0, kickoffTouchbacks: 0,
        // PUNTING
        puntAttempts: 0, puntYards: 0, puntsBlocked: 0,
        puntsInside20: 0, puntTouchbacks: 0, puntLong: 0,
        // KICK RETURNS
        kickReturnAttempts: 0, kickReturnYards: 0, kickReturnTD: 0, kickReturnLong: 0,
        // PUNT RETURNS
        puntReturnAttempts: 0, puntReturnYards: 0, puntReturnTD: 0, puntReturnLong: 0,
        // BLOCKING
        pancakes: 0, sacksAllowed: 0,
      };
    }
    return players[key];
  };
  const max = (a, b) => (b > a ? b : a);

  for (const log of logs) {
    if (!log || !log.completed) continue;
    const seenInThisGame = new Set();
    for (const [teamName, sections] of Object.entries(log.teams || {})) {
      (sections.passing || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.passCompletions += toNum(p.CMP);
        r.passAttempts    += toNum(p.ATT);
        r.passYards       += toNum(p.YDS);
        r.passTD          += toNum(p.TD);
        r.interceptions   += toNum(p.INT);
        r.sacksTaken      += toNum(p.SACK);
        r.passLong         = max(r.passLong, toNum(p.LONG));
        const rating = toNum(p.RATING);
        if (toNum(p.ATT) > 0) { r._passRatingSum += rating; r._passRatingGames += 1; }
        if (toNum(p.ATT) > 0 && !r.position) r.position = "QB";
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.rushing || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.rushAttempts += toNum(p.ATT);
        r.rushYards    += toNum(p.YDS);
        r.rushTD       += toNum(p.TD);
        r.fumbles      += toNum(p.FUM);
        r.rushLong      = max(r.rushLong, toNum(p.LONG));
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.receiving || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.receptions += toNum(p.REC);
        r.recYards   += toNum(p.YDS);
        r.recTD      += toNum(p.TD);
        r.drops      += toNum(p.DROP);
        r.yac        += toNum(p.YAC);
        r.recLong     = max(r.recLong, toNum(p.LONG));
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.defense || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.tackles                += toNum(p.TOT);
        r.tacklesForLoss         += toNum(p.LOSS);
        r.sacks                  += toNum(p.SACK);
        r.forcedFumbles          += toNum(p.FF);
        r.fumbleRecoveries       += toNum(p.FREC);
        r.intReturnYards         += toNum(p.YDS);
        r.fumbleRecTD            += toNum(p.TD); // DEFENSE.TD is fumble/INT return TD
        r.defensiveInterceptions += toNum(p.INT);
        r.intReturnYards         += toNum(p.RET);
        r.deflections            += toNum(p.DEFLECTIONS);
        r.safeties               += toNum(p.SAFETIES);
        r.catchesAllowed         += toNum(p["CTH ALLOW"]);
        r.bigHits                += toNum(p["BIG HITS"]);
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.kicking || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.fgMade            += toNum(p.FGM);
        r.fgAttempts        += toNum(p.FGA);
        r.fgsBlocked        += toNum(p.FGSBLOCKED);
        r.xpMade            += toNum(p.XPM);
        r.xpAttempts        += toNum(p.XPA);
        r.xpsBlocked        += toNum(p.XPSBLOCKED);
        r.kickoffs          += toNum(p.KICKOFFS);
        r.kickoffTouchbacks += toNum(p.TOUCHBACKS);
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.punting || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.puntAttempts    += toNum(p.ATT);
        r.puntYards       += toNum(p.YDS);
        r.puntsBlocked    += toNum(p.BLOCKS);
        r.puntsInside20   += toNum(p.IN20);
        r.puntTouchbacks  += toNum(p.TOUCHBACKS);
        r.puntLong         = max(r.puntLong, toNum(p.LONG));
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.kickReturns || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.kickReturnAttempts += toNum(p.ATT);
        r.kickReturnYards    += toNum(p.YDS);
        r.kickReturnTD       += toNum(p.TD);
        r.kickReturnLong      = max(r.kickReturnLong, toNum(p.LONG));
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.puntReturns || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.puntReturnAttempts += toNum(p.ATT);
        r.puntReturnYards    += toNum(p.YDS);
        r.puntReturnTD       += toNum(p.TD);
        r.puntReturnLong      = max(r.puntReturnLong, toNum(p.LONG));
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
      (sections.blocking || []).forEach((p) => {
        const r = ensure(teamName, p.name);
        r.pancakes     += toNum(p.PANCAKES);
        r.sacksAllowed += toNum(p["SACKS ALLOWED"]);
        seenInThisGame.add(`${teamName}::${p.name}`);
      });
    }
    seenInThisGame.forEach((k) => { if (players[k]) players[k].gamesPlayed += 1; });
  }

  // ── Recompute rate stats from totals (more accurate than averaging) ──
  for (const r of Object.values(players)) {
    r.passCompletionPct = r.passAttempts ? (r.passCompletions / r.passAttempts) * 100 : 0;
    r.passYPA           = r.passAttempts ? r.passYards / r.passAttempts : 0;
    r.passRating        = r._passRatingGames ? r._passRatingSum / r._passRatingGames : 0;
    r.rushAvg           = r.rushAttempts ? r.rushYards / r.rushAttempts : 0;
    r.recAvg            = r.receptions ? r.recYards / r.receptions : 0;
    r.dropPct           = (r.receptions + r.drops) ? (r.drops / (r.receptions + r.drops)) * 100 : 0;
    r.yacAvg            = r.receptions ? r.yac / r.receptions : 0;
    r.fgPct             = r.fgAttempts ? (r.fgMade / r.fgAttempts) * 100 : 0;
    r.xpPct             = r.xpAttempts ? (r.xpMade / r.xpAttempts) * 100 : 0;
    r.puntAvg           = r.puntAttempts ? r.puntYards / r.puntAttempts : 0;
    r.kickReturnAvg     = r.kickReturnAttempts ? r.kickReturnYards / r.kickReturnAttempts : 0;
    r.puntReturnAvg     = r.puntReturnAttempts ? r.puntReturnYards / r.puntReturnAttempts : 0;
    r.tflPlusSackPlusFF = r.tacklesForLoss + r.sacks + r.forcedFumbles;
    // Clean up internal accumulators
    delete r._passRatingSum;
    delete r._passRatingGames;
  }

  return Object.values(players);
}

// Kept for backward compat with existing call sites.
export function parseGameStats(csvText) {
  return parseCSV(csvText);
}

// ── Output helpers ─────────────────────────────────────────
export function toCSV(data) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  data.forEach((row) => {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  });
  return lines.join("\n");
}

export function downloadCSV(data, filename) {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

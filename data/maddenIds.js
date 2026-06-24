// ── Madden 08 ID Mappings ──────────────────────────────────
// These map directly to the NZA editor column values

export const TEAM_IDS = {
  1: { abbr: "CHI", name: "Bears", city: "Chicago" },
  2: { abbr: "CIN", name: "Bengals", city: "Cincinnati" },
  3: { abbr: "BUF", name: "Bills", city: "Buffalo" },
  4: { abbr: "DEN", name: "Broncos", city: "Denver" },
  5: { abbr: "CLE", name: "Browns", city: "Cleveland" },
  6: { abbr: "TB", name: "Buccaneers", city: "Tampa Bay" },
  7: { abbr: "ARI", name: "Cardinals", city: "Arizona" },
  8: { abbr: "LAC", name: "Chargers", city: "San Diego" },
  9: { abbr: "KC", name: "Chiefs", city: "Kansas City" },
  10: { abbr: "IND", name: "Colts", city: "Indianapolis" },
  11: { abbr: "DAL", name: "Cowboys", city: "Dallas" },
  12: { abbr: "MIA", name: "Dolphins", city: "Miami" },
  13: { abbr: "PHI", name: "Eagles", city: "Philadelphia" },
  14: { abbr: "ATL", name: "Falcons", city: "Atlanta" },
  15: { abbr: "SF", name: "49ers", city: "San Francisco" },
  16: { abbr: "NYG", name: "Giants", city: "New York" },
  17: { abbr: "JAX", name: "Jaguars", city: "Jacksonville" },
  18: { abbr: "NYJ", name: "Jets", city: "New York" },
  19: { abbr: "DET", name: "Lions", city: "Detroit" },
  20: { abbr: "GB", name: "Packers", city: "Green Bay" },
  21: { abbr: "CAR", name: "Panthers", city: "Carolina" },
  22: { abbr: "NE", name: "Patriots", city: "New England" },
  23: { abbr: "LV", name: "Raiders", city: "Oakland" },
  24: { abbr: "LAR", name: "Rams", city: "St. Louis" },
  25: { abbr: "BAL", name: "Ravens", city: "Baltimore" },
  26: { abbr: "WAS", name: "Redskins", city: "Washington" },
  27: { abbr: "NO", name: "Saints", city: "New Orleans" },
  28: { abbr: "SEA", name: "Seahawks", city: "Seattle" },
  29: { abbr: "PIT", name: "Steelers", city: "Pittsburgh" },
  30: { abbr: "TEN", name: "Titans", city: "Tennessee" },
  31: { abbr: "MIN", name: "Vikings", city: "Minnesota" },
  32: { abbr: "HOU", name: "Texans", city: "Houston" },
  1009: { abbr: "FA", name: "Free Agents", city: "" },
  250: { abbr: "ADM", name: "Admirals", city: "" },
  251: { abbr: "CEN", name: "Centurions", city: "" },
  252: { abbr: "THR", name: "Thunder", city: "" },
  253: { abbr: "GXY", name: "Galaxy", city: "" },
  254: { abbr: "FIR", name: "Fire", city: "" },
  255: { abbr: "SDL", name: "SeaDevils", city: "" },
  1015: { abbr: "DFT", name: "Draft", city: "" },
  1023: { abbr: "DEL", name: "Delete", city: "" },
  1014: { abbr: "RET", name: "Retired", city: "" },
};

export const TEAM_IDS_BY_ABBR = Object.fromEntries(
  Object.entries(TEAM_IDS).map(([id, t]) => [t.abbr, parseInt(id)])
);

export const POSITION_IDS = {
  0: { abbr: "QB", name: "Quarterback", group: "QB", side: "offense" },
  1: { abbr: "HB", name: "Halfback", group: "RB", side: "offense" },
  2: { abbr: "FB", name: "Fullback", group: "FB", side: "offense" },
  3: { abbr: "WR", name: "Wide Receiver", group: "WR", side: "offense" },
  4: { abbr: "TE", name: "Tight End", group: "TE", side: "offense" },
  5: { abbr: "LT", name: "Left Tackle", group: "OL", side: "offense" },
  6: { abbr: "LG", name: "Left Guard", group: "OL", side: "offense" },
  7: { abbr: "C", name: "Center", group: "OL", side: "offense" },
  8: { abbr: "RG", name: "Right Guard", group: "OL", side: "offense" },
  9: { abbr: "RT", name: "Right Tackle", group: "OL", side: "offense" },
  10: { abbr: "LE", name: "Left End", group: "DE", side: "defense" },
  11: { abbr: "RE", name: "Right End", group: "DE", side: "defense" },
  12: { abbr: "DT", name: "Defensive Tackle", group: "DT", side: "defense" },
  13: { abbr: "LOLB", name: "Left Outside Linebacker", group: "OLB", side: "defense" },
  14: { abbr: "MLB", name: "Middle Linebacker", group: "MLB", side: "defense" },
  15: { abbr: "ROLB", name: "Right Outside Linebacker", group: "OLB", side: "defense" },
  16: { abbr: "CB", name: "Cornerback", group: "CB", side: "defense" },
  17: { abbr: "FS", name: "Free Safety", group: "S", side: "defense" },
  18: { abbr: "SS", name: "Strong Safety", group: "S", side: "defense" },
  19: { abbr: "K", name: "Kicker", group: "K", side: "special" },
  20: { abbr: "P", name: "Punter", group: "P", side: "special" },
};

export const POSITION_IDS_BY_ABBR = Object.fromEntries(
  Object.entries(POSITION_IDS).map(([id, p]) => [p.abbr, parseInt(id)])
);

// ── Height Conversion ──────────────────────────────────────
export const HEIGHT_MAP = {
  66: "5'6\"", 67: "5'7\"", 68: "5'8\"", 69: "5'9\"", 70: "5'10\"",
  71: "5'11\"", 72: "6'0\"", 73: "6'1\"", 74: "6'2\"", 75: "6'3\"",
  76: "6'4\"", 77: "6'5\"", 78: "6'6\"", 79: "6'7\"", 80: "6'8\"",
  81: "6'9\"", 82: "6'10\"", 83: "6'11\"", 84: "7'0\"",
};

export function maddenHeightToDisplay(val) {
  return HEIGHT_MAP[val] || `${Math.floor(val / 12)}'${val % 12}"`;
}

export function displayHeightToMadden(heightStr) {
  const match = heightStr.match(/(\d+)'(\d+)"/);
  if (match) return parseInt(match[1]) * 12 + parseInt(match[2]);
  return null;
}

// ── Weight Conversion ──────────────────────────────────────
// Madden stores weight as (actual - 160), so actual = stored + 160
export function maddenWeightToDisplay(val) {
  return val + 160;
}

export function displayWeightToMadden(weight) {
  return weight - 160;
}

// ── Roster Requirements ────────────────────────────────────
export const ROSTER_REQUIREMENTS = {
  QB: { min: 2, positions: [0] },
  RB: { min: 3, positions: [1] },
  FB: { min: 1, positions: [2], groupWith: "TE", toggleDefault: true },
  TE: { min: 2, positions: [4], groupWith: "FB", toggleDefault: true },
  WR: { min: 4, positions: [3] },
  OT: { min: 4, positions: [5, 9], groupWith: "OG,C", groupLabel: "OL" },
  OG: { min: 4, positions: [6, 8], groupWith: "OT,C", groupLabel: "OL" },
  C: { min: 2, positions: [7], groupWith: "OT,OG", groupLabel: "OL" },
  DE: { min: 4, positions: [10, 11], groupWith: "DT", toggleDefault: true },
  DT: { min: 3, positions: [12], groupWith: "DE", toggleDefault: true },
  OLB: { min: 4, positions: [13, 15], groupWith: "MLB", toggleDefault: true },
  MLB: { min: 2, positions: [14], groupWith: "OLB", toggleDefault: true },
  CB: { min: 4, positions: [16] },
  FS: { min: 2, positions: [17], groupWith: "SS", groupLabel: "S" },
  SS: { min: 2, positions: [18], groupWith: "FS", groupLabel: "S" },
  K: { min: 1, positions: [19] },
  P: { min: 1, positions: [20] },
};

// Group compatibility rules
export const GROUP_COMPAT = {
  OL: { positions: [5, 6, 7, 8, 9], labels: ["OT", "OG", "C"] },
  S: { positions: [17, 18], labels: ["FS", "SS"] },
  FB_TE: { positions: [2, 4], labels: ["FB", "TE"] },
  LB: { positions: [13, 14, 15], labels: ["OLB", "MLB"] },
  DL: { positions: [10, 11, 12], labels: ["DE", "DT"] },
};

// ── NZA CSV Column Map ─────────────────────────────────────
// Only the columns we care about from the NZA editor export
export const NZA_COLUMNS = {
  V: "firstName",
  W: "lastName",
  U: "throwAccuracy",
  Z: "stamina",
  AC: "kickAccuracy",
  AD: "acceleration",
  AG: "playerId",
  AH: "teamId",
  AJ: "speed",
  AK: "age",
  AO: "toughness",
  AS: "catch",
  AV: "agility",
  AZ: "injury",
  BA: "tackle",
  BB: "passBlock",
  BC: "runBlock",
  BF: "breakTackle",
  BO: "collegeId",
  BY: "jerseyNumber",
  CH: "throwPower",
  CJ: "jump",
  CN: "carry",
  CR: "kickPower",
  CS: "strength",
  CT: "overall",
  CU: "awareness",
  DJ: "positionId",
  DS: "height",
  DT: "weight",
  DV: "kickReturn",
};

// Stats CSV column mapping
export const STATS_COLUMNS = {
  // From "2023 Standings - Player Stats.csv"
  player: "playerName",
  team: "teamAbbr",
  pos: "position",
  gp: "gamesPlayed",
  // Passing
  "pass att": "passAttempts",
  "pass comp": "passCompletions",
  "pass yds": "passYards",
  "pass td": "passTD",
  int: "interceptions",
  // Rushing
  "rush att": "rushAttempts",
  "rush yds": "rushYards",
  "rush td": "rushTD",
  // Receiving
  rec: "receptions",
  "rec yds": "recYards",
  "rec td": "recTD",
  // Defense
  tack: "tackles",
  sack: "sacks",
  "int def": "defensiveInterceptions",
  "ff": "forcedFumbles",
  "fr": "fumbleRecoveries",
  // Kicking
  "fg made": "fgMade",
  "fg att": "fgAttempts",
  "xp made": "xpMade",
  "xp att": "xpAttempts",
  // Punting
  "punt avg": "puntAverage",
  "punt in 20": "puntInside20",
  // Returns
  "kr yds": "kickReturnYards",
  "pr yds": "puntReturnYards",
  "kr td": "kickReturnTD",
  "pr td": "puntReturnTD",
};

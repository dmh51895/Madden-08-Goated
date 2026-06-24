// ── NFL Conference / Division structure ────────────────────
// These aren't mock data — they're real-world organizational facts
// about the NFL. Extracted here so StandingsPage and any future
// divisional view can resolve conference/division for any team
// abbreviation even when the uploaded standings CSV doesn't
// include those columns.

export const DIVISIONS = {
  AFC: ["East", "North", "South", "West"],
  NFC: ["East", "North", "South", "West"],
};

/** Team abbreviation → { conference, division } mapping.
 *  Covers all 32 active teams plus legacy abbreviations (OAK→Raiders/AFC West,
 *  SD→Chargers/AFC West, STL→Rams/NFC West) so older rosters resolve. */
export const DIVISION_LOOKUP = {
  // AFC East
  BUF: { conference: "AFC", division: "East" },
  MIA: { conference: "AFC", division: "East" },
  NE:  { conference: "AFC", division: "East" },
  NYJ: { conference: "AFC", division: "East" },
  // AFC North
  BAL: { conference: "AFC", division: "North" },
  CIN: { conference: "AFC", division: "North" },
  CLE: { conference: "AFC", division: "North" },
  PIT: { conference: "AFC", division: "North" },
  // AFC South
  HOU: { conference: "AFC", division: "South" },
  IND: { conference: "AFC", division: "South" },
  JAX: { conference: "AFC", division: "South" },
  TEN: { conference: "AFC", division: "South" },
  // AFC West
  DEN: { conference: "AFC", division: "West" },
  KC:  { conference: "AFC", division: "West" },
  LV:  { conference: "AFC", division: "West" },
  OAK: { conference: "AFC", division: "West" },   // legacy Raiders
  LAC: { conference: "AFC", division: "West" },
  SD:  { conference: "AFC", division: "West" },   // legacy Chargers
  // NFC East
  DAL: { conference: "NFC", division: "East" },
  NYG: { conference: "NFC", division: "East" },
  PHI: { conference: "NFC", division: "East" },
  WAS: { conference: "NFC", division: "East" },
  // NFC North
  CHI: { conference: "NFC", division: "North" },
  DET: { conference: "NFC", division: "North" },
  GB:  { conference: "NFC", division: "North" },
  MIN: { conference: "NFC", division: "North" },
  // NFC South
  ATL: { conference: "NFC", division: "South" },
  CAR: { conference: "NFC", division: "South" },
  NO:  { conference: "NFC", division: "South" },
  TB:  { conference: "NFC", division: "South" },
  // NFC West
  ARI: { conference: "NFC", division: "West" },
  LAR: { conference: "NFC", division: "West" },
  STL: { conference: "NFC", division: "West" },   // legacy Rams
  SF:  { conference: "NFC", division: "West" },
  SEA: { conference: "NFC", division: "West" },
};

/** Look up { conference, division } for a team abbreviation. */
export function divisionOf(abbr) {
  if (!abbr) return { conference: "", division: "" };
  return DIVISION_LOOKUP[String(abbr).toUpperCase()] || { conference: "", division: "" };
}

/** Take a standings array (possibly missing conference/division fields)
 *  and return a new array with those fields filled in from the lookup. */
export function annotateStandingsWithDivisions(standings) {
  return (standings || []).map((t) => {
    if (t.conference && t.division) return t;
    const { conference, division } = divisionOf(t.abbr);
    return { ...t, conference: t.conference || conference, division: t.division || division };
  });
}

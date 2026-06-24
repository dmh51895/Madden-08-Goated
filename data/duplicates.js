// ── Duplicate player name detection ────────────────────────
// Players with identical first+last names break stat attribution
// (game logs only print the printed name, no ID). This module finds
// dupes and applies user-chosen renames.

export function findDuplicateNames(roster) {
  const groups = new Map();
  roster.forEach((p) => {
    const key = `${(p.firstName || "").trim()} ${(p.lastName || "").trim()}`.trim();
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });
  const dupes = [];
  for (const [name, players] of groups) {
    if (players.length > 1) {
      dupes.push({
        name,
        count: players.length,
        players: players.map((p) => ({
          playerId: p.playerId,
          team: p.teamAbbr,
          position: p.positionAbbr,
          overall: p.overall,
          age: p.age,
          firstName: p.firstName,
          lastName: p.lastName,
        })),
      });
    }
  }
  return dupes.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Apply a batch of renames. `renames` is keyed by playerId and contains
// { firstName, lastName }. Returns a new roster array.
export function applyRenames(roster, renames) {
  if (!renames || Object.keys(renames).length === 0) return roster;
  return roster.map((p) => {
    const r = renames[p.playerId];
    if (!r) return p;
    const next = { ...p };
    if (r.firstName !== undefined) next.firstName = r.firstName;
    if (r.lastName !== undefined) next.lastName = r.lastName;
    // Also flush into __raw so NZA export carries the rename through.
    if (next.__raw) {
      next.__raw = { ...next.__raw };
      if (r.firstName !== undefined) next.__raw["First Name"] = r.firstName;
      if (r.lastName !== undefined) next.__raw["Last Name"] = r.lastName;
    }
    return next;
  });
}

// Suggest a default rename for the Nth duplicate: append " II", " III", etc.
// First instance stays as-is; subsequent get suffixed.
export function suggestRenames(dupe) {
  const suggestions = {};
  dupe.players.forEach((p, idx) => {
    if (idx === 0) return;
    const suffix = romanNumeral(idx + 1);
    suggestions[p.playerId] = { firstName: p.firstName, lastName: `${p.lastName} ${suffix}` };
  });
  return suggestions;
}

function romanNumeral(n) {
  const r = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return r[n] || `(${n})`;
}

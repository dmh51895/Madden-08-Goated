// Team brand colors extracted from madcat.css (original MADCAT stylesheet).
// These are the Madden-08-era colors — pre-rebrand for some teams (Bucs red,
// Redskins, Chargers powder navy etc). Authentic to the project's vibe.

export const TEAM_COLORS = {
  ARI: { bg: "#A50039", fg: "#FFFFFF", name: "Cardinals" },
  ATL: { bg: "#000000", fg: "#FFFFFF", name: "Falcons" },
  BAL: { bg: "#31186B", fg: "#FFFFFF", name: "Ravens" },
  BUF: { bg: "#18498C", fg: "#FFFFFF", name: "Bills" },
  CAR: { bg: "#009ED6", fg: "#FFFFFF", name: "Panthers" },
  CHI: { bg: "#001C39", fg: "#FFFFFF", name: "Bears" },
  CIN: { bg: "#000000", fg: "#FFFFFF", name: "Bengals" },
  CLE: { bg: "#EF7D10", fg: "#FFFFFF", name: "Browns" },
  DAL: { bg: "#10285A", fg: "#FFFFFF", name: "Cowboys" },
  DEN: { bg: "#000042", fg: "#FFFFFF", name: "Broncos" },
  DET: { bg: "#0069B5", fg: "#FFFFFF", name: "Lions" },
  GB:  { bg: "#003C29", fg: "#FFFFFF", name: "Packers" },
  HOU: { bg: "#BD0839", fg: "#FFFFFF", name: "Texans" },
  IND: { bg: "#21386B", fg: "#FFFFFF", name: "Colts" },
  JAX: { bg: "#007994", fg: "#FFFFFF", name: "Jaguars" },
  KC:  { bg: "#CE0021", fg: "#FFFFFF", name: "Chiefs" },
  LV:  { bg: "#000000", fg: "#FFFFFF", name: "Raiders" },   // formerly OAK
  OAK: { bg: "#000000", fg: "#FFFFFF", name: "Raiders" },   // legacy abbr
  LAC: { bg: "#04284F", fg: "#FFFFFF", name: "Chargers" },  // formerly SD
  SD:  { bg: "#04284F", fg: "#FFFFFF", name: "Chargers" },  // legacy abbr
  LAR: { bg: "#001842", fg: "#FFFFFF", name: "Rams" },      // formerly STL
  STL: { bg: "#001842", fg: "#FFFFFF", name: "Rams" },      // legacy abbr
  MIA: { bg: "#007984", fg: "#FFFFFF", name: "Dolphins" },
  MIN: { bg: "#310452", fg: "#FFFFFF", name: "Vikings" },
  NE:  { bg: "#213C84", fg: "#FFFFFF", name: "Patriots" },
  NO:  { bg: "#000000", fg: "#FFFFFF", name: "Saints" },
  NYG: { bg: "#00497B", fg: "#FFFFFF", name: "Giants" },
  NYJ: { bg: "#104529", fg: "#FFFFFF", name: "Jets" },
  PHI: { bg: "#00414A", fg: "#FFFFFF", name: "Eagles" },
  PIT: { bg: "#000000", fg: "#FFFFFF", name: "Steelers" },
  SF:  { bg: "#A50039", fg: "#FFFFFF", name: "49ers" },
  SEA: { bg: "#39517B", fg: "#FFFFFF", name: "Seahawks" },
  TB:  { bg: "#BD0839", fg: "#FFFFFF", name: "Buccaneers" },
  TEN: { bg: "#6B9ECE", fg: "#FFFFFF", name: "Titans" },
  WAS: { bg: "#7B0029", fg: "#FFFFFF", name: "Redskins" },  // legacy name
};

// Conference colors (also from madcat.css: .AFC, .NFC, .NFL)
export const CONF_COLORS = {
  AFC: { bg: "#B10002", fg: "#FFFFFF" },
  NFC: { bg: "#013577", fg: "#FFFFFF" },
  NFL: { bg: "#023478", fg: "#FFFFFF" },
};

const FALLBACK = { bg: "#1a1a1a", fg: "#ddd", name: "" };

/** Get { bg, fg, name } for a team abbreviation (e.g. "CHI"). */
export function teamColor(abbr) {
  if (!abbr) return FALLBACK;
  return TEAM_COLORS[String(abbr).toUpperCase()] || FALLBACK;
}

/** Just the brand background color hex string. */
export function teamBg(abbr) {
  return teamColor(abbr).bg;
}

/** A version of the brand color suitable for use as a *text* accent on a
 *  dark UI — pure black teams (Raiders, Steelers, Saints, Bengals, Falcons)
 *  would be invisible, so we lift those to a readable gray. */
export function teamAccent(abbr) {
  const c = teamColor(abbr);
  // If the brand bg is too dark, the chip works fine but a glowing-text use
  // (e.g. team abbr in a leaderboard) needs a brighter swap. The threshold is
  // intentionally simple: pure or near-pure black gets a neutral light gray.
  if (/^#0{1,6}$|^#000000$/.test(c.bg)) return "#bbbbbb";
  return c.bg;
}

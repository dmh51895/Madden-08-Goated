// ── Admin Role System ──────────────────────────────────────
// 0 = Full admin (league settings, everything)
// 1 = No access (default for unauthenticated)
// 2 = General viewing (approved user, no submissions)
// 3 = Team management (default for team owners — can manage their team)
// 4 = Approved moderators (draft order, picks, schedule, trade votes)

export const ROLES = {
  ADMIN: 0,
  NONE: 1,
  VIEWER: 2,
  TEAM_OWNER: 3,
  MODERATOR: 4,
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Full Admin",
  [ROLES.NONE]: "No Access",
  [ROLES.VIEWER]: "Viewer",
  [ROLES.TEAM_OWNER]: "Team Owner",
  [ROLES.MODERATOR]: "Moderator",
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: "#ff4444",
  [ROLES.NONE]: "#666",
  [ROLES.VIEWER]: "#00d8a8",
  [ROLES.TEAM_OWNER]: "#7c8cff",
  [ROLES.MODERATOR]: "#ffd700",
};

// Permission checks
export function canAccessPage(role, page) {
  const permissions = {
    [ROLES.ADMIN]: "*",
    [ROLES.NONE]: [],
    [ROLES.VIEWER]: ["standings", "teams", "schedules", "leaders", "player", "gamecenter", "playoffs", "records", "power"],
    [ROLES.TEAM_OWNER]: [
      "standings", "teams", "schedules", "leaders", "player", "gamecenter",
      "playoffs", "records", "power", "draft", "freeagents", "injuries",
      "breakdown", "teammgmt",
    ],
    [ROLES.MODERATOR]: [
      "standings", "teams", "schedules", "leaders", "player", "gamecenter",
      "playoffs", "records", "power", "draft", "freeagents", "injuries",
      "breakdown", "teammgmt", "tradepoll",
    ],
  };

  if (role === ROLES.ADMIN) return true;
  const allowed = permissions[role] || [];
  return allowed.includes(page);
}

export function canSubmitChanges(role) {
  return role === ROLES.ADMIN || role === ROLES.TEAM_OWNER || role === ROLES.MODERATOR;
}

export function canManageTeam(role) {
  return role === ROLES.ADMIN || role === ROLES.TEAM_OWNER;
}

export function canManageLeague(role) {
  return role === ROLES.ADMIN;
}

export function canManageDraft(role) {
  return role === ROLES.ADMIN || role === ROLES.MODERATOR;
}

export function canVoteTrade(role) {
  return role === ROLES.ADMIN || role === ROLES.MODERATOR || role === ROLES.TEAM_OWNER;
}

// ── Season Manager ─────────────────────────────────────────
export function getCurrentSeason(data) {
  return data.currentSeason || 2024;
}

export function getSeasonData(data, year) {
  return data.seasons?.[year] || null;
}

export function switchSeason(data, newYear) {
  // Save current season state
  if (data.currentSeason && data.seasons) {
    data.seasons[data.currentSeason] = {
      ...data,
      savedAt: Date.now(),
    };
  }

  return {
    ...data,
    currentSeason: newYear,
    seasons: data.seasons || {},
  };
}

// ── URL Routing ────────────────────────────────────────────
export function getSeasonUrl(team, year) {
  return `/Roster/${team}/${year}/`;
}

export function getScheduleUrl(team, year) {
  return `/Schedule/${team}/${year}/`;
}

export function parseSeasonFromUrl(pathname) {
  const match = pathname.match(/\/(?:Roster|Schedule)\/([^/]+)\/(\d{4})\//);
  if (match) {
    return { team: match[1], year: parseInt(match[2]) };
  }
  return null;
}

// ── Camp System ────────────────────────────────────────────
export const CAMP_ATTRIBUTES = [
  { key: "speed", label: "SPD", max: 20 },
  { key: "acceleration", label: "ACC", max: 20 },
  { key: "agility", label: "AGI", max: 20 },
  { key: "strength", label: "STR", max: 20 },
  { key: "awareness", label: "AWR", max: 20 },
  { key: "throwPower", label: "TPO", max: 20 },
  { key: "throwAccuracy", label: "TAC", max: 20 },
  { key: "carry", label: "CAR", max: 20 },
  { key: "catch", label: "CIT", max: 20 },
  { key: "jump", label: "JMP", max: 20 },
  { key: "breakTackle", label: "BTK", max: 20 },
  { key: "tackle", label: "TAK", max: 20 },
  { key: "passBlock", label: "PBL", max: 20 },
  { key: "runBlock", label: "RBL", max: 20 },
  { key: "kickAccuracy", label: "KAC", max: 20 },
  { key: "kickPower", label: "KPO", max: 20 },
  { key: "kickReturn", label: "KRT", max: 20 },
  { key: "stamina", label: "STA", max: 20 },
  { key: "injury", label: "INJ", max: 20 },
  { key: "toughness", label: "TGH", max: 20 },
];

// Hard limits by position (configurable per league)
export const DEFAULT_HARD_LIMITS = {};

export function getCampMaxUpgrade(player, attribute, hardLimits = {}) {
  const currentValue = player[attribute] || 0;
  const cap = 99;

  // Check hard limit for this position
  const posGroup = player.positionGroup || "";
  const hardLimit = hardLimits[`${attribute}_${posGroup}`];

  let maxAllowed = cap - currentValue;
  if (hardLimit !== undefined && hardLimit !== null) {
    maxAllowed = Math.min(maxAllowed, hardLimit - currentValue);
  }

  return Math.max(0, maxAllowed);
}

export function validateCampUpgrade(player, attribute, upgrade, hardLimits = {}) {
  const currentValue = player[attribute] || 0;
  const newValue = currentValue + upgrade;

  if (newValue > 99) {
    const maxAllowed = 99 - currentValue;
    return { valid: false, maxAllowed, reason: `Would exceed 99 cap (max +${maxAllowed})` };
  }

  const hardLimit = hardLimits[`${attribute}_${player.positionGroup || ""}`];
  if (hardLimit !== undefined && newValue > hardLimit) {
    const maxAllowed = hardLimit - currentValue;
    return { valid: false, maxAllowed, reason: `Hard limit for ${player.positionGroup} is ${hardLimit} (max +${maxAllowed})` };
  }

  return { valid: true, newValue, maxAllowed: getCampMaxUpgrade(player, attribute, hardLimits) };
}

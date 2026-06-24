// ── Persistent Data Store ──────────────────────────────────
// Stores all league data by season, with localStorage persistence

import { TEAM_IDS, TEAM_IDS_BY_ABBR, POSITION_IDS } from "./maddenIds";

const STORAGE_KEY = "pcft-league-data";

// Accept either a numeric team ID or an abbreviation string and return both.
function resolveTeam(target) {
  if (typeof target === "number") {
    return { teamId: target, teamAbbr: TEAM_IDS[target]?.abbr || "FA" };
  }
  const abbr = String(target);
  const teamId = TEAM_IDS_BY_ABBR[abbr] ?? 1009;
  return { teamId, teamAbbr: abbr };
}

const DEFAULT_DATA = {
  currentSeason: 2024,
  seasons: {},
  currentUser: null,
  users: {},
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return { ...DEFAULT_DATA };
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export function getSeasonData(data, year) {
  return data.seasons?.[year] || createEmptySeason(year);
}

export function createEmptySeason(year) {
  return {
    year,
    roster: [],
    schedule: [],
    standings: [],
    playerStats: [],
    teamStats: [],
    draftBoard: [],
    draftPicks: [],
    tradeChart: [],
    colleges: {},
    settings: {
      leagueName: "PCFTBALL",
      weeksPerSeason: 16,
      playoffTeams: 12,
      maxRosterSize: 55,
      tradesEnabled: true,
      campsEnabled: true,
      futureDraftRounds: 4,
      currentDraftRounds: 7,
      toggleSettings: {
        FB: true,
        TE: true,
        OLB: true,
        MLB: true,
        DE: true,
        DT: true,
      },
      hardLimits: {},
      teamOwners: {},
    },
    injuries: [],
    trades: [],
    transactions: [],
  };
}

export function updateSeasonData(data, year, updates) {
  const newSeason = {
    ...(data.seasons?.[year] || createEmptySeason(year)),
    ...updates,
  };

  return {
    ...data,
    currentSeason: year,
    seasons: {
      ...data.seasons,
      [year]: newSeason,
    },
  };
}

// Get team roster for current season
export function getTeamRoster(data, teamAbbr, year) {
  const season = getSeasonData(data, year || data.currentSeason);
  return season.roster.filter((p) => p.teamAbbr === teamAbbr);
}

// Get free agents (teamId = 1009)
export function getFreeAgents(data, year) {
  const season = getSeasonData(data, year || data.currentSeason);
  return season.roster.filter((p) => p.teamId === 1009);
}

// Sign a player to a team. `targetTeam` may be a numeric team ID or an abbr.
export function signPlayer(data, playerId, targetTeam, year) {
  const seasonYear = year || data.currentSeason;
  const season = getSeasonData(data, seasonYear);
  const roster = [...season.roster];
  const playerIdx = roster.findIndex((p) => p.playerId === playerId);
  if (playerIdx === -1) return data;

  const { teamId, teamAbbr } = resolveTeam(targetTeam);
  roster[playerIdx] = { ...roster[playerIdx], teamId, teamAbbr };
  return updateSeasonData(data, seasonYear, { roster });
}

// Release a player (move to Free Agents, team ID 1009).
export function releasePlayer(data, playerId, year) {
  return signPlayer(data, playerId, 1009, year);
}

// Update player position. Refreshes positionAbbr / positionGroup so filters work.
export function changePosition(data, playerId, newPositionId, year) {
  const seasonYear = year || data.currentSeason;
  const season = getSeasonData(data, seasonYear);
  const roster = [...season.roster];
  const playerIdx = roster.findIndex((p) => p.playerId === playerId);
  if (playerIdx === -1) return data;

  const posMeta = POSITION_IDS[newPositionId] || {};
  roster[playerIdx] = {
    ...roster[playerIdx],
    positionId: newPositionId,
    positionAbbr: posMeta.abbr || roster[playerIdx].positionAbbr,
    positionGroup: posMeta.group || roster[playerIdx].positionGroup,
  };
  return updateSeasonData(data, seasonYear, { roster });
}

// Update jersey number.
export function changeJersey(data, playerId, newNumber, year) {
  const seasonYear = year || data.currentSeason;
  const season = getSeasonData(data, seasonYear);
  const roster = [...season.roster];
  const playerIdx = roster.findIndex((p) => p.playerId === playerId);
  if (playerIdx === -1) return data;

  roster[playerIdx] = { ...roster[playerIdx], jerseyNumber: newNumber };
  return updateSeasonData(data, seasonYear, { roster });
}

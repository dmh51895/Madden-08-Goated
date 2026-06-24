// ── Schedule Engine ─────────────────────────────────────────
// Manages schedules with reciprocal validation — if Team A plays Team B in Week 8,
// Team B automatically has Team A in Week 8. No double-booking allowed.

import { TEAM_IDS, TEAM_IDS_BY_ABBR } from "./maddenIds";

// Validate that a game doesn't conflict with existing schedule
export function validateGame(schedule, week, homeTeam, awayTeam, excludeGameId = null) {
  const errors = [];

  // Can't play yourself
  if (homeTeam === awayTeam) {
    errors.push("Team cannot play itself");
    return errors;
  }

  // Check home team isn't already playing this week
  const homeConflict = schedule.find(
    (g) => g.week === week && (g.home === homeTeam || g.away === homeTeam) && g.id !== excludeGameId
  );
  if (homeConflict) {
    errors.push(`${homeTeam} already has a game in Week ${week} vs ${homeConflict.home === homeTeam ? homeConflict.away : homeConflict.home}`);
  }

  // Check away team isn't already playing this week
  const awayConflict = schedule.find(
    (g) => g.week === week && (g.home === awayTeam || g.away === awayTeam) && g.id !== excludeGameId
  );
  if (awayConflict) {
    errors.push(`${awayTeam} already has a game in Week ${week} vs ${awayConflict.home === awayTeam ? awayConflict.away : awayConflict.home}`);
  }

  // Check for duplicate matchup (same teams, any week)
  const duplicate = schedule.find(
    (g) =>
      ((g.home === homeTeam && g.away === awayTeam) ||
        (g.home === awayTeam && g.away === homeTeam)) &&
      g.id !== excludeGameId
  );
  if (duplicate) {
    errors.push(`${homeTeam} vs ${awayTeam} already scheduled in Week ${duplicate.week}`);
  }

  return errors;
}

// Add a game to the schedule (with reciprocal logic)
export function addGame(schedule, week, homeTeam, awayTeam, year = 2024) {
  const errors = validateGame(schedule, week, homeTeam, awayTeam);
  if (errors.length > 0) return { success: false, errors };

  const newGame = {
    id: `${year}-W${week}-${Date.now()}`,
    week,
    home: homeTeam,
    away: awayTeam,
    homeScore: 0,
    awayScore: 0,
    played: false,
    time: null,
  };

  return { success: true, game: newGame, errors: [] };
}

// Remove a game (and its reciprocal)
export function removeGame(schedule, gameId) {
  return schedule.filter((g) => g.id !== gameId);
}

// Auto-generate a full season schedule
export function generateSchedule(teams, weeksPerSeason = 16, year = 2024) {
  const teamAbbrs = teams.map((t) => t.abbr || t);
  const schedule = [];

  // Simple round-robin: each team plays every other team once in their conference,
  // plus some cross-conference games
  for (let week = 1; week <= weeksPerSeason; week++) {
    const weekGames = [];
    const used = new Set();

    for (const team of teamAbbrs) {
      if (used.has(team)) continue;

      // Find an opponent that hasn't been used this week
      const opponent = teamAbbrs.find(
        (t) => t !== team && !used.has(t) && !schedule.some(
          (g) =>
            (g.home === team && g.away === t) ||
            (g.home === t && g.away === team)
        )
      );

      if (opponent) {
        weekGames.push({
          id: `${year}-W${week}-${team}-${opponent}`,
          week,
          home: team,
          away: opponent,
          homeScore: 0,
          awayScore: 0,
          played: false,
          time: null,
        });
        used.add(team);
        used.add(opponent);
      }
    }

    schedule.push(...weekGames);
  }

  return schedule;
}

// Get all games for a specific team
export function getTeamSchedule(schedule, teamAbbr) {
  return schedule.filter((g) => g.home === teamAbbr || g.away === teamAbbr);
}

// Get all opponents for a team
export function getTeamOpponents(schedule, teamAbbr) {
  const opponents = new Set();
  schedule.forEach((g) => {
    if (g.home === teamAbbr) opponents.add(g.away);
    if (g.away === teamAbbr) opponents.add(g.home);
  });
  return [...opponents];
}

// Get week number options (respecting season length setting)
export function getAvailableWeeks(maxWeeks = 18) {
  return Array.from({ length: maxWeeks }, (_, i) => i + 1);
}

// Check if a team has a bye week
export function getTeamByeWeek(schedule, teamAbbr, maxWeeks = 18) {
  const playedWeeks = schedule
    .filter((g) => g.home === teamAbbr || g.away === teamAbbr)
    .map((g) => g.week);
  const allWeeks = getAvailableWeeks(maxWeeks);
  const byeWeeks = allWeeks.filter((w) => !playedWeeks.includes(w));
  return byeWeeks.length === 1 ? byeWeeks[0] : null;
}

"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TEAM_IDS, TEAM_IDS_BY_ABBR, POSITION_IDS } from "../data/maddenIds";
import { parseNzaroster, parseColleges, parseDraftBoard, parseDraftPicks, parseTradeChart, parsePlayerStats, parseStandings, parseTeamStats, parseCSV, downloadCSV, parseGameLog, aggregateGameLogs, exportNzaroster } from "../data/csvParser";
import { loadDB, saveDB, clearDB, getDefaultData, migrateFromLocalStorage } from "../data/indexedDB";
import { getSeasonData, createEmptySeason, updateSeasonData, signPlayer as storeSignPlayer, releasePlayer as storeReleasePlayer, changePosition as storeChangePosition, changeJersey as storeChangeJersey } from "../data/dataStore";
import { ROLES, ROLE_LABELS, ROLE_COLORS, canAccessPage, canSubmitChanges, canManageTeam, canManageLeague } from "../data/adminRoles";
import { generateSchedule as engineGenerateSchedule, addGame, removeGame, getAvailableWeeks } from "../data/scheduleEngine";
import { getBreakdownDisplay, analyzeBreakdown } from "../data/rosterEngine";
import { findDuplicateNames, applyRenames, suggestRenames } from "../data/duplicates";
import { useConfirm } from "./ConfirmDialog";

// ── Page Imports ────────────────────────────────────────────
import StandingsPage from "./StandingsPage";
import TeamsPage from "./TeamsPage";
import SchedulesPage from "./SchedulesPage";
import LeadersPage from "./LeadersPage";
import PlayerPage from "./PlayerPage";
import GamecenterPage from "./GamecenterPage";
import DraftPage from "./DraftPage";
import FreeAgentsPage from "./FreeAgentsPage";
import InjuriesPage from "./InjuriesPage";
import PlayoffsPage from "./PlayoffsPage";
import RecordsPage from "./RecordsPage";
import CoachesPage from "./CoachesPage";
import PowerPage from "./PowerPage";
import SettingsPage from "./SettingsPage";
import BreakdownPage from "./BreakdownPage";
import SetupSeasonPage from "./SetupSeasonPage";
import TeamMgmtPage from "./TeamMgmtPage";
import TradeChartPage from "./TradeChartPage";
import DuplicatesPage from "./DuplicatesPage";
import HomePage from "./HomePage";

const TEAMS_LIST = Object.values(TEAM_IDS).filter((t) => t.abbr !== "FA" && t.abbr !== "DFT" && t.abbr !== "DEL" && t.abbr !== "RET" && t.abbr !== "ADM" && t.abbr !== "CEN" && t.abbr !== "THR" && t.abbr !== "GXY" && t.abbr !== "FIR" && t.abbr !== "SDL");

export default function AppShell({ initialPanel = "home", initialTeam = null, initialYear = null, initialPlayer = null }) {
  // ── Persistent State ────────────────────────────────────
  // Start with defaults (sync); async IndexedDB load hydrates immediately after.
  const [appData, setAppData] = useState(() => {
    const d = getDefaultData();
    if (initialYear) d.currentSeason = initialYear;
    return d;
  });
  const [panel, setPanel] = useState(initialPanel);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayer);
  const [teamFilter, setTeamFilter] = useState(initialTeam);

  // Logged-in user is stored in appData (persisted in IndexedDB) so the role
  // survives navigation/reload — local state would reset to null on every page.
  const currentUser = appData.currentUser || null;
  const setCurrentUser = (user) => setAppData((prev) => ({ ...prev, currentUser: user }));

  // Promise-based confirmation for every data mutation (see ConfirmDialog).
  const confirm = useConfirm();

  // ── IndexedDB hydration ──────────────────────────────────
  // Load full league data from IndexedDB on mount. Also attempts a one-time
  // migration from the old localStorage key if IndexedDB is empty.
  const didHydrate = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let fromDB = await loadDB();
      // One-time migration from old localStorage key
      if (!fromDB) {
        fromDB = await migrateFromLocalStorage();
      }
      if (cancelled) return;
      if (fromDB) {
        if (initialYear) fromDB.currentSeason = initialYear;
        setAppData(fromDB);
      }
      didHydrate.current = true;
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced save: every time appData changes, flush to IndexedDB after a
  // short delay.  This prevents writing on every keystroke while ensuring
  // data is persisted before the user switches tabs/panels.
  useEffect(() => {
    if (!didHydrate.current) return; // don't save the default before hydration
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDB(appData);
    }, 300);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [appData]);

  const currentSeason = appData.currentSeason || initialYear || 2024;
  // Years to show in the selector: every season that has data, plus the current
  // one and a few recent defaults — sorted newest-first. Arbitrary years (e.g.
  // 2000 for a tournament) appear here once created.
  const seasonYears = Array.from(new Set([
    ...Object.keys(appData.seasons || {}).map(Number),
    currentSeason, 2024, 2023, 2022, 2021, 2020,
  ])).filter((y) => Number.isFinite(y)).sort((a, b) => b - a);
  const seasonData = getSeasonData(appData, currentSeason);
  const settings = seasonData.settings || {};
  const darkMode = settings.darkMode !== undefined ? settings.darkMode : true;

  // ── Role-based access (User Access) ──────────────────────
  // Local-first rule: if nobody is logged in, treat as full admin so the app
  // works out of the box. Logging in as a specific role then applies that
  // role's permissions. (Self-assigned roles — convenience gating to prevent
  // accidental edits, not hard security, since this is a local browser app.)
  const role = currentUser?.role;
  const loggedIn = !!currentUser;
  const isAdminUser = !loggedIn || role === ROLES.ADMIN;
  const isModUser   = isAdminUser || role === ROLES.MODERATOR;
  const canEdit     = !loggedIn || canSubmitChanges(role);  // admin / mod / team owner
  const canLeague   = !loggedIn || canManageLeague(role);   // admin only (commissioner)
  const requireEdit = async () => {
    if (canEdit) return true;
    await confirm({ title: "Permission needed", body: `Your role (${ROLE_LABELS[role] || "Viewer"}) can't make changes. Log in as Admin, Moderator, or Team Owner under Settings → User Access.`, confirmLabel: "OK" });
    return false;
  };
  const toggleSettings = settings.toggleSettings || {};
  // Homepage hero/GOTW images (stored as data URLs in appData)
  const newsImage = seasonData.newsImage || null;
  const gotwImage = seasonData.gotwImage || null;

  // ── Data from uploaded files ────────────────────────────
  const roster = seasonData.roster || [];
  const schedule = seasonData.schedule || [];
  const uploadedPlayerStats = seasonData.playerStats || [];
  const gameLogs = seasonData.gameLogs || [];
  const teamStats = seasonData.teamStats || [];
  const draftBoard = seasonData.draftBoard || [];
  const draftPicks = seasonData.draftPicks || [];
  const tradeChart = seasonData.tradeChart || [];
  const colleges = seasonData.colleges || {};

  // ── Derived Data ────────────────────────────────────────
  const freeAgents = useMemo(() => roster.filter((p) => p.teamId === 1009), [roster]);

  // Aggregated stats: prefer live game-log totals if any logs have been uploaded;
  // otherwise fall back to the CSV-uploaded stats. This is what the rest of the
  // app sees as `playerStats`.
  const playerStats = useMemo(() => {
    if (gameLogs && gameLogs.length) return aggregateGameLogs(gameLogs);
    return uploadedPlayerStats;
  }, [gameLogs, uploadedPlayerStats]);

  // Derive standings from completed game logs when possible.
  const standings = useMemo(() => {
    if (seasonData.standings?.length > 0) return seasonData.standings;

    const base = Object.fromEntries(TEAMS_LIST.map((t) => [t.name, {
      abbr: t.abbr, city: t.city, name: t.name,
      conference: "NFL", division: "",
      w: 0, l: 0, t: 0, pf: 0, pa: 0, diff: 0, powerRanking: 0,
    }]));
    (gameLogs || []).forEach((g) => {
      if (!g.completed) return;
      const home = base[g.home];
      const away = base[g.away];
      if (!home || !away) return;
      home.pf += g.homeScore; home.pa += g.awayScore;
      away.pf += g.awayScore; away.pa += g.homeScore;
      if (g.homeScore > g.awayScore) { home.w++; away.l++; }
      else if (g.awayScore > g.homeScore) { away.w++; home.l++; }
      else { home.t++; away.t++; }
    });
    Object.values(base).forEach((t) => { t.diff = t.pf - t.pa; });
    return Object.values(base);
  }, [seasonData, gameLogs]);

  // Duplicate-name list — exposed for the Settings page and TeamMgmt page.
  const duplicateNames = useMemo(() => findDuplicateNames(roster), [roster]);

  const updateData = useCallback((updates) => {
    setAppData((prev) => updateSeasonData(prev, currentSeason, updates));
  }, [currentSeason]);

  // ── File Upload Handlers ────────────────────────────────
  const handleRosterUpload = async (csvText) => {
    const parsed = parseNzaroster(csvText);
    if (roster.length && !(await confirm({ title: "Replace roster", body: `Replace the ${currentSeason} roster (${roster.length} players) with the uploaded file (${parsed.length} players)?`, danger: true, confirmLabel: "Replace" }))) return;
    updateData({ roster: parsed });
  };

  const handleCollegesUpload = (csvText) => {
    const parsed = parseColleges(csvText);
    updateData({ colleges: parsed });
  };

  const handleDraftBoardUpload = (csvText) => {
    const parsed = parseDraftBoard(csvText);
    updateData({ draftBoard: parsed });
  };

  const handleDraftPicksUpload = (csvText) => {
    const parsed = parseDraftPicks(csvText);
    updateData({ draftPicks: parsed });
  };

  const handleTradeChartUpload = (csvText) => {
    const parsed = parseTradeChart(csvText);
    updateData({ tradeChart: parsed });
  };

  const handlePlayerStatsUpload = (csvText) => {
    const parsed = parsePlayerStats(csvText);
    updateData({ playerStats: parsed });
  };

  const handleStandingsUpload = (csvText) => {
    const parsed = parseStandings(csvText);
    updateData({ standings: parsed });
  };

  const handleTeamStatsUpload = (csvText) => {
    const parsed = parseTeamStats(csvText);
    updateData({ teamStats: parsed });
  };

  // Game-log .txt upload (one file = one game). Appends to the seasonal log list.
  // Supports multi-file selection: pass an array of {text, name}.
  // Incomplete games ("Game was not completed.") are silently dropped — those
  // are virtually always GG concessions or aborted matches; the actual result
  // is recorded via the score-override entry below.
  const [lastUploadNotice, setLastUploadNotice] = useState(null);
  const handleGameLogUpload = (input) => {
    const items = Array.isArray(input) ? input : [{ text: input, name: "" }];
    const parsed = items.map(({ text, name }) => parseGameLog(text, name));
    const completed = parsed.filter((g) => g.completed);
    const dropped = parsed.length - completed.length;
    setAppData((prev) => {
      const cur = getSeasonData(prev, currentSeason);
      const existing = cur.gameLogs || [];
      const known = new Set(existing.map((g) => g.filename));
      const merged = [...existing, ...completed.filter((g) => !known.has(g.filename))];
      return updateSeasonData(prev, currentSeason, { gameLogs: merged });
    });
    if (dropped > 0) {
      setLastUploadNotice({
        type: "info",
        text: `Skipped ${dropped} incomplete game${dropped === 1 ? "" : "s"} — use the score override to record GG/concede results.`,
        ts: Date.now(),
      });
    } else {
      setLastUploadNotice(null);
    }
  };

  const handleClearGameLogs = async () => {
    if (!(await requireEdit())) return;
    if (gameLogs.length && !(await confirm({ title: "Clear game logs", body: `Remove all ${gameLogs.length} uploaded game log${gameLogs.length === 1 ? "" : "s"} for ${currentSeason}? Standings derived from them will reset.`, danger: true, confirmLabel: "Clear logs" }))) return;
    updateData({ gameLogs: [] });
  };

  // Homepage image handlers (store as base64 data URLs)
  const handleNewsImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateData({ newsImage: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleGOTWImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateData({ gotwImage: ev.target.result });
    reader.readAsDataURL(file);
  };

  // ── Manual game result (score override) ────────────────────
  // For games that were conceded mid-play and never produced a completed log.
  // Counts toward standings but contributes no individual stats.
  // Friendly label helpers for confirmation messages.
  const playerById = (id) => roster.find((p) => String(p.playerId) === String(id));
  const nameOf = (id) => { const p = playerById(id); return p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() || "this player" : "this player"; };

  const handleAddManualResult = async (result) => {
    if (!(await requireEdit())) return;
    const a = result?.away ?? "Away", h = result?.home ?? "Home";
    const as = result?.awayScore, hs = result?.homeScore;
    const score = (as != null && hs != null) ? ` (${a} ${as} – ${h} ${hs})` : "";
    if (!(await confirm({ title: "Record game result", body: `Record this result into the ${currentSeason} standings?${score}` }))) return;
    setAppData((prev) => {
      const cur = getSeasonData(prev, currentSeason);
      const existing = cur.manualResults || [];
      const id = `m-${Date.now()}-${existing.length}`;
      const next = [...existing, { id, ...result }];
      return updateSeasonData(prev, currentSeason, { manualResults: next });
    });
  };

  const handleRemoveManualResult = async (id) => {
    if (!(await requireEdit())) return;
    if (!(await confirm({ title: "Remove result", body: "Remove this manually recorded result from the standings?", danger: true, confirmLabel: "Remove" }))) return;
    setAppData((prev) => {
      const cur = getSeasonData(prev, currentSeason);
      const existing = cur.manualResults || [];
      return updateSeasonData(prev, currentSeason, { manualResults: existing.filter((r) => r.id !== id) });
    });
  };

  // Export the current season's roster as a valid NZA-editor CSV.
  const handleExportRoster = () => {
    if (!roster.length) return;
    const csv = exportNzaroster(roster);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster_${currentSeason}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply a batch of renames to fix duplicate names. Flushes through to NZA roundtrip.
  const handleApplyRenames = async (renames) => {
    if (!(await requireEdit())) return;
    const n = Array.isArray(renames) ? renames.length : Object.keys(renames || {}).length;
    if (!(await confirm({ title: "Apply renames", body: `Apply ${n} player rename${n === 1 ? "" : "s"} to the ${currentSeason} roster?` }))) return;
    setAppData((prev) => {
      const cur = getSeasonData(prev, currentSeason);
      const newRoster = applyRenames(cur.roster || [], renames);
      return updateSeasonData(prev, currentSeason, { roster: newRoster });
    });
  };

  // Wipe all league data from IndexedDB.
  const handleClearAll = async () => {
    if (!(await confirm({ title: "Erase ALL data", body: "This permanently erases every season's roster, schedule, draft, stats and settings from this browser. This cannot be undone.", danger: true, confirmLabel: "Erase everything" }))) return;
    await clearDB();
    setAppData(getDefaultData());
  };

  // ── Team Management Actions ─────────────────────────────
  const handleSignPlayer = async (playerId, targetTeam) => {
    if (!(await requireEdit())) return;
    if (!(await confirm({ title: "Sign player", body: `Sign ${nameOf(playerId)} to ${targetTeam} for ${currentSeason}?` }))) return;
    setAppData((prev) => storeSignPlayer(prev, playerId, targetTeam, currentSeason));
  };

  const handleReleasePlayer = async (playerId) => {
    if (!(await requireEdit())) return;
    if (!(await confirm({ title: "Release player", body: `Release ${nameOf(playerId)} to free agency for ${currentSeason}?`, danger: true, confirmLabel: "Release" }))) return;
    setAppData((prev) => storeReleasePlayer(prev, playerId, currentSeason));
  };

  const handleChangePosition = async (playerId, newPosId) => {
    if (!(await requireEdit())) return;
    const posAbbr = POSITION_IDS?.[newPosId]?.abbr || `position #${newPosId}`;
    if (!(await confirm({ title: "Change position", body: `Change ${nameOf(playerId)} to ${posAbbr}?` }))) return;
    setAppData((prev) => storeChangePosition(prev, playerId, newPosId, currentSeason));
  };

  const handleChangeJersey = async (playerId, newNum) => {
    if (!(await requireEdit())) return;
    if (!(await confirm({ title: "Change jersey", body: `Change ${nameOf(playerId)}'s jersey to #${newNum}?` }))) return;
    setAppData((prev) => storeChangeJersey(prev, playerId, newNum, currentSeason));
  };

  // ── Season Management ───────────────────────────────────
  // ── Season Management (#5/#6) ───────────────────────────
  // Switch seasons. A "tournament" is just another year. If the target year has
  // no data yet, offer to carry the static league data forward from the most
  // recent season that has a roster (schedule/stats always start fresh).
  const STATIC_CARRY = ["roster", "draftBoard", "draftPicks", "tradeChart", "colleges", "settings"];
  const mostRecentSeasonWithRoster = (seasons, exclude) => {
    const yrs = Object.keys(seasons || {}).map(Number).filter((y) => y !== exclude && seasons[y]?.roster?.length);
    return yrs.length ? Math.max(...yrs) : null;
  };

  const handleSeasonChange = async (newYear) => {
    newYear = Number(newYear);
    if (!Number.isFinite(newYear) || newYear === currentSeason) return;
    const existing = appData.seasons?.[newYear];
    const hasData = existing && existing.roster?.length;
    let carrySrc = null;
    if (!hasData) {
      const src = mostRecentSeasonWithRoster(appData.seasons, newYear);
      if (src != null) {
        const ok = await confirm({
          title: "New season",
          body: `${newYear} has no data yet. Start it from ${src}'s roster, draft board, picks and trade chart?\n(Schedule and stats start fresh for ${newYear}.)`,
          confirmLabel: "Carry forward",
        });
        if (ok) carrySrc = src;
      }
    }
    setAppData((prev) => {
      const seasons = { ...prev.seasons, [currentSeason]: getSeasonData(prev, currentSeason) };
      if (carrySrc != null && !(seasons[newYear]?.roster?.length)) {
        const srcSeason = seasons[carrySrc] || {};
        const cloned = createEmptySeason(newYear);
        for (const k of STATIC_CARRY) if (srcSeason[k] != null) cloned[k] = JSON.parse(JSON.stringify(srcSeason[k]));
        seasons[newYear] = cloned;
      }
      return { ...prev, currentSeason: newYear, seasons };
    });
  };

  // Prompt for any year (e.g. 2000 for a tournament) and switch to it.
  const handleNewSeason = async () => {
    if (typeof window === "undefined") return;
    const def = String(currentSeason + 1);
    const input = window.prompt("Enter a year for the new season or tournament (any number — e.g. 2025, or 2000 for a tournament):", def);
    if (input == null) return;
    const y = parseInt(input, 10);
    if (!Number.isFinite(y)) { await confirm({ title: "Invalid year", body: `"${input}" isn't a valid year.`, confirmLabel: "OK" }); return; }
    await handleSeasonChange(y);
    setPanel("setup");
  };

  // ── Custom schedule builder (#5) ────────────────────────
  const handleAddGame = async (week, away, home) => {
    if (!(await requireEdit())) return;
    week = Number(week);
    if (!week || !away || !home || away === home) { await confirm({ title: "Can't add game", body: "Pick a week/round and two different teams.", confirmLabel: "OK" }); return; }
    const cur = getSeasonData(appData, currentSeason);
    const res = addGame(cur.schedule || [], week, home, away, currentSeason);
    if (!res.success) { await confirm({ title: "Can't add game", body: (res.errors || ["Invalid matchup."]).join("\n"), confirmLabel: "OK" }); return; }
    if (!(await confirm({ title: "Add game", body: `Add Week ${week}: ${away} @ ${home} to the ${currentSeason} schedule?` }))) return;
    setAppData((prev) => {
      const c = getSeasonData(prev, currentSeason);
      return updateSeasonData(prev, currentSeason, { schedule: [...(c.schedule || []), res.game] });
    });
  };

  const handleRemoveGame = async (gameId) => {
    if (!(await requireEdit())) return;
    if (!(await confirm({ title: "Remove game", body: "Remove this game from the schedule?", danger: true, confirmLabel: "Remove" }))) return;
    setAppData((prev) => {
      const c = getSeasonData(prev, currentSeason);
      return updateSeasonData(prev, currentSeason, { schedule: removeGame(c.schedule || [], gameId) });
    });
  };

  const handleGenerateSchedule = async () => {
    if (!(await confirm({ title: "Auto-generate schedule", body: "Generate a full round-robin schedule? This replaces the current schedule." }))) return;
    const newSchedule = engineGenerateSchedule(TEAMS_LIST, settings.weeksPerSeason || 16, currentSeason);
    setAppData((prev) => updateSeasonData(prev, currentSeason, { schedule: newSchedule }));
  };

  const handleSettingsUpdate = (newSettings) => {
    updateData({ settings: { ...settings, ...newSettings } });
  };

  // ── Panel Navigation + URL routing ─────────────────────────────────────
  const router = useRouter();
  const pathname = usePathname();

  // Sync URL when panel changes. For deep routes (/roster/{team}/{year},
  // /schedule/{team}/{year}, /player/{id}) we don't fight the URL when it
  // matches the active panel — but if the user navigates AWAY from one of
  // these deep links, we DO update the URL so it doesn't stay stale.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onDeepRosterLink   = pathname?.startsWith("/roster/");
    const onDeepScheduleLink = pathname?.startsWith("/schedule/");
    const onDeepPlayerLink   = pathname?.startsWith("/player/");

    // Skip URL push if the user is still on the matching panel for their deep link
    if (onDeepRosterLink   && panel === "teams")     return;
    if (onDeepScheduleLink && panel === "schedules") return;
    if (onDeepPlayerLink   && panel === "player")    return;

    // When the player panel has a specific player selected, the canonical URL is
    // the deep /player/{id}/ route — NOT bare /player/. Computing it here (instead
    // of just "/player/") stops this effect from racing navigateToPlayer's push
    // and clobbering it with router.replace("/player/").
    let target;
    if (panel === "player" && selectedPlayer != null && selectedPlayer !== "") target = `/player/${selectedPlayer}/`;
    else target = `/${panel}/`;

    if (pathname !== target && pathname !== target.replace(/\/$/, "")) {
      router.replace(target, { scroll: false });
    }
  }, [panel, pathname, router, selectedPlayer]);

  // Reset selectedPlayer when leaving the player panel — next time the user
  // visits PLAYER, they get the default lookup directory, not a stale profile.
  useEffect(() => {
    if (panel !== "player" && selectedPlayer != null) {
      setSelectedPlayer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // Push the deep URL when navigating to a team's roster from another page.
  const wrappedNavigateToTeam = useCallback((teamAbbr) => {
    setSelectedTeam(teamAbbr);
    setTeamFilter(teamAbbr);
    setPanel("teams");
    if (typeof window !== "undefined") {
      router.push(`/roster/${teamAbbr}/${currentSeason}/`, { scroll: false });
    }
  }, [router, currentSeason]);

  const panels = [
    { id: "home", label: "🏠 HOME", color: "#c41e1e" },
    { id: "standings", label: "📊 STANDINGS", color: "#15803d" },
    { id: "teams", label: "🏈 TEAMS", color: "#c41e1e" },
    { id: "schedules", label: "📅 SCHEDULES", color: "#3b6db5" },
    { id: "leaders", label: "🏆 LEADERS", color: "#d4a017" },
    { id: "player", label: "👤 PLAYER", color: "#a8651e" },
    { id: "gamecenter", label: "🎮 GAMECENTER", color: "#ff8800" },
    { id: "draft", label: "📋 DRAFT", color: "#00d4ff" },
    { id: "tradechart", label: "🔄 TRADES", color: "#c41e1e" },
    { id: "freeagents", label: "🆓 FREE AGENTS", color: "#22c55e" },
    { id: "injuries", label: "🏥 INJURIES", color: "#dc2626" },
    { id: "playoffs", label: "🏅 PLAYOFFS", color: "#d4a017" },
    { id: "records", label: "📜 RECORDS", color: "#ff9d4d" },
    { id: "coaches", label: "👔 OWNERS", color: "#5865F2" },
    { id: "power", label: "⚡ POWER", color: "#a8651e" },
    { id: "breakdown", label: "📋 BREAKDOWN", color: "#ff9d4d" },
    { id: "teammgmt", label: "🏈 TEAM MGMT", color: "#3b6db5" },
    { id: "duplicates", label: `🪪 DUPLICATES${duplicateNames.length ? ` (${duplicateNames.length})` : ""}`, color: "#ff9d4d" },
    { id: "settings", label: "⚙️ SETTINGS", color: "#888" },
  ];

  const navigateToPlayer = (playerKey) => {
    // null/undefined/empty → go to player lookup directory (clears selection)
    if (playerKey == null || playerKey === "") {
      setSelectedPlayer(null);
      setPanel("player");
      if (typeof window !== "undefined") router.push(`/player/`, { scroll: false });
      return;
    }
    // playerKey may be a playerId (number/string from roster rows) OR a
    // playerName string (from playerStats/leaderboard rows that have no id).
    // Resolve to a playerId here so PlayerPage's lookup is unambiguous.
    let resolvedId = playerKey;
    if (typeof playerKey === "string" && /^[A-Za-z]/.test(playerKey) && roster.length) {
      const norm = playerKey.trim().toLowerCase();
      const hit = roster.find((p) => {
        const full = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase();
        return full === norm || `${p.lastName || ""}, ${p.firstName || ""}`.toLowerCase() === norm;
      });
      if (hit) resolvedId = hit.playerId;
    }
    setSelectedPlayer(resolvedId);
    setPanel("player");
    if (typeof window !== "undefined" && resolvedId != null && resolvedId !== "") {
      router.push(`/player/${resolvedId}/`, { scroll: false });
    }
  };

  // ── Render Panel Content ─────────────────────────────────
  const renderPanel = () => {
    const sharedProps = {
      standings,
      schedule,
      players: roster,
      coaches: [],
      draftPicks,
      draftBoard,
      tradeChart,
      teams: TEAMS_LIST,
      year: currentSeason,
      leagueName: settings.leagueName || "PCFTBALL",
      myTeam: TEAMS_LIST[0],
      navigateToTeam: wrappedNavigateToTeam,
      navigateToPlayer,
      roster,
      freeAgents,
      colleges,
      settings,
      toggleSettings,
      playerStats,
      teamStats,
      teamFilter,
      setTeamFilter,
      currentUser,
      gameLogs,
      duplicateNames,
    };

    switch (panel) {
      case "home":
        return <HomePage {...sharedProps} panel={panel} setPanel={setPanel} newsImage={newsImage} gotwImage={gotwImage} onNewsImageUpload={handleNewsImageUpload} onGOTWImageUpload={handleGOTWImageUpload} onUpdateSettings={handleSettingsUpdate} />;
      case "standings":
        return <StandingsPage {...sharedProps} />;
      case "teams":
        return <TeamsPage {...sharedProps} selectedTeam={selectedTeam} allSeasons={appData.seasons} />;
      case "schedules":
        return <SchedulesPage {...sharedProps} schedule={schedule} gameLogs={gameLogs} onUploadGameLog={handleGameLogUpload} onClearGameLogs={handleClearGameLogs} onAddGame={handleAddGame} onRemoveGame={handleRemoveGame} />;
      case "leaders":
        return <LeadersPage {...sharedProps} />;
      case "player":
        return <PlayerPage {...sharedProps} selectedPlayer={selectedPlayer} colleges={colleges} />;
      case "gamecenter":
        return <GamecenterPage {...sharedProps} gameResults={gameLogs} />;
      case "draft":
        return <DraftPage {...sharedProps} onImport={handleDraftBoardUpload} onImportPicks={handleDraftPicksUpload} />;
      case "tradechart":
        return <TradeChartPage {...sharedProps} onImport={handleTradeChartUpload} />;
      case "freeagents":
        return <FreeAgentsPage {...sharedProps} onSignPlayer={handleSignPlayer} />;
      case "injuries":
        return <InjuriesPage {...sharedProps} />;
      case "playoffs":
        return <PlayoffsPage {...sharedProps} />;
      case "records":
        return <RecordsPage {...sharedProps} />;
      case "coaches":
        return <CoachesPage {...sharedProps} />;
      case "power":
        return <PowerPage {...sharedProps} />;
      case "breakdown":
        return <BreakdownPage {...sharedProps} onUpdateSettings={handleSettingsUpdate} />;
      case "teammgmt":
        return <TeamMgmtPage {...sharedProps} onSignPlayer={handleSignPlayer} onReleasePlayer={handleReleasePlayer} onChangePosition={handleChangePosition} onChangeJersey={handleChangeJersey} />;
      case "duplicates":
        return <DuplicatesPage duplicates={duplicateNames} onApplyRenames={handleApplyRenames} />;
      case "setup":
        return (
          <SetupSeasonPage
            settings={settings}
            onUpdateSettings={handleSettingsUpdate}
            teams={TEAMS_LIST}
            schedule={schedule}
            onAddGame={handleAddGame}
            onRemoveGame={handleRemoveGame}
            onGenerateSchedule={handleGenerateSchedule}
            currentSeason={currentSeason}
            canEdit={!currentUser || currentUser.role === 0}
            setPanel={setPanel}
          />
        );
      case "settings":
        return (
          <SettingsPage
            canLeague={canLeague}
            canEdit={canEdit}
            darkMode={darkMode}
            settings={settings}
            onUpdateSettings={handleSettingsUpdate}
            currentSeason={currentSeason}
            onSeasonChange={handleSeasonChange}
            onRosterUpload={handleRosterUpload}
            onCollegesUpload={handleCollegesUpload}
            onDraftBoardUpload={handleDraftBoardUpload}
            onDraftPicksUpload={handleDraftPicksUpload}
            onTradeChartUpload={handleTradeChartUpload}
            onPlayerStatsUpload={handlePlayerStatsUpload}
            onStandingsUpload={handleStandingsUpload}
            onTeamStatsUpload={handleTeamStatsUpload}
            onGameLogUpload={handleGameLogUpload}
            onExportRoster={handleExportRoster}
            onClearAll={handleClearAll}
            duplicateCount={duplicateNames.length}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            teams={TEAMS_LIST}
          />
        );
      default:
        return <StandingsPage {...sharedProps} />;
    }
  };

  // ── Styles ───────────────────────────────────────────────
  const bg = darkMode ? "#0a0a0a" : "#f5f5f5";
  const border = darkMode ? "#333" : "#ddd";
  const text = darkMode ? "#e0e0e0" : "#111";
  const textMuted = darkMode ? "#999" : "#666";

  // Optional background image (PCFT-style fixed field). Uses an uploaded data
  // URL from settings if present, otherwise /background.jpg. A translucent
  // overlay keeps content panels readable; if no image exists the overlay over
  // the solid colour just looks like the solid colour (graceful no-op).
  const bgImage = settings.backgroundImage || "/background.jpg";
  const dim = settings.backgroundDim != null ? settings.backgroundDim : 0.85;
  const ov = darkMode ? "8,8,10" : "245,245,245";
  const rootBackground = `linear-gradient(rgba(${ov},${dim}), rgba(${ov},${Math.min(0.97, dim + 0.05)})), url("${bgImage}") center center / cover no-repeat fixed, ${bg}`;

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: rootBackground, backgroundColor: bg, minHeight: "100vh", color: text, fontSize: 12 }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: darkMode ? "#050505" : "#eee", borderBottom: `1px solid ${border}` }}>
        {/* Brand strip */}
        <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "flex-end", borderBottom: `1px solid ${border}`, gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, color: textMuted, letterSpacing: 1 }}>SEASON</span>
            <select
              value={currentSeason}
              onChange={(e) => { if (e.target.value === "__new__") handleNewSeason(); else handleSeasonChange(parseInt(e.target.value)); }}
              style={{ fontSize: 9, padding: "3px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#d4a017", fontFamily: "inherit", fontWeight: "bold" }}
            >
              {seasonYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
              <option value="__new__">➕ New season / tournament…</option>
            </select>
            {currentUser && (
              <span style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, border: `1px solid ${ROLE_COLORS[currentUser.role]}`, color: ROLE_COLORS[currentUser.role], letterSpacing: 1, fontWeight: "bold" }}>
                {ROLE_LABELS[currentUser.role]}
              </span>
            )}
            <button
              onClick={() => setPanel("settings")}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer", fontFamily: "inherit" }}
              title="Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Team logo strip + banner (legacy PCFT header). Assets are optional —
            each image hides itself on 404, with a text fallback for the banner. */}
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <LeagueHeader navigateToTeam={wrappedNavigateToTeam} leagueName={settings.leagueName || "PCFTBALL"} />
        </div>

        {/* Grouped nav (mirrors original PCFT dropdown structure) */}
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <NavBar
            panel={panel}
            setPanel={setPanel}
            duplicateCount={duplicateNames.length}
            isAdmin={isModUser}
          />
        </div>
      </div>

      {/* ── Panel Content ─────────────────────────────────── */}
      <div style={{ padding: "12px 16px", maxWidth: 1200, margin: "0 auto" }}>
        {renderPanel()}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div style={{ padding: "12px", textAlign: "center", color: textMuted, fontSize: 8, borderTop: `1px solid ${border}`, marginTop: 24 }}>
        MADCAT v1.9.5 · Madden Career Tracker · GNU GPL · Season {currentSeason}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// LeagueHeader — 32-team logo strip + banner, matching the legacy
// PCFT header. Drop assets in:  public/logos/{ABBR}.png  (32×32)
// and  public/banner.png  (~990×167). Missing assets self-hide;
// the banner falls back to the PCFTBALL wordmark.
// ─────────────────────────────────────────────────────────────
const TEAM_ABBRS = [
  "ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB",
  "HOU","IND","JAX","KC","LV","LAC","LAR","MIA","MIN","NE","NO","NYG",
  "NYJ","PHI","PIT","SF","SEA","TB","TEN","WAS",
];

function LeagueHeader({ navigateToTeam, leagueName }) {
  const [bannerOk, setBannerOk] = React.useState(true);
  return (
    <div style={{ background: "#050505", borderBottom: "1px solid #2a2a2a" }}>
      {/* Logo strip */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 4, padding: "6px 10px" }}>
        {TEAM_ABBRS.map((abbr) => (
          <img
            key={abbr}
            src={`/logos/${abbr}.png`}
            alt={abbr}
            title={abbr}
            width={28}
            height={28}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            onClick={() => navigateToTeam?.(abbr)}
            style={{ cursor: "pointer", objectFit: "contain", opacity: 0.92, transition: "opacity 0.12s" }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "0.92")}
          />
        ))}
      </div>
      {/* Banner (~990×167) with wordmark fallback */}
      <div style={{ display: "flex", justifyContent: "center", padding: bannerOk ? "0 0 8px" : "4px 0 14px" }}>
        {bannerOk ? (
          <img
            src="/banner.png"
            alt={leagueName}
            onError={() => setBannerOk(false)}
            style={{ width: "100%", maxWidth: 990, height: "auto", display: "block" }}
          />
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: "bold", color: "#c41e1e", letterSpacing: 5 }}>{leagueName}</div>
            <div style={{ fontSize: 9, color: "#777", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>Madden at its highest level</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NavBar — grouped dropdown navigation matching the original
// PCFT site structure (League ▾ / Teams ▾ / Draft ▾ / etc.)
// ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { id: "home", label: "HOME", panelId: "home" },
  {
    id: "league", label: "LEAGUE",
    items: [
      { panelId: "standings",   label: "Standings" },
      { panelId: "power",       label: "Power Rankings" },
      { panelId: "leaders",     label: "Leaders" },
      { panelId: "records",     label: "Records" },
      { panelId: "playoffs",    label: "Playoffs" },
      { panelId: "breakdown",   label: "League Breakdown" },
    ],
  },
  {
    id: "teams", label: "TEAMS",
    items: [
      { panelId: "teams",       label: "Rosters" },
      { panelId: "freeagents",  label: "Free Agents" },
      { panelId: "injuries",    label: "Injuries" },
    ],
  },
  { id: "player",     label: "PLAYER",     panelId: "player" },
  { id: "schedules",  label: "SCHEDULE",   panelId: "schedules" },
  { id: "gamecenter", label: "GAMECENTER", panelId: "gamecenter" },
  {
    id: "draft", label: "DRAFT",
    items: [
      { panelId: "draft",      label: "Draft Board" },
      { panelId: "tradechart", label: "Trade Chart" },
    ],
  },
];

const ADMIN_GROUP = {
  id: "admin", label: "ADMIN",
  items: [
    { panelId: "teammgmt",   label: "Team Mgmt" },
    { panelId: "duplicates", label: "Duplicates", withCount: true },
    { panelId: "coaches",    label: "Coaches" },
    { panelId: "settings",   label: "Settings" },
    { panelId: "setup",      label: "Season Setup" },
  ],
};

function NavBar({ panel, setPanel, duplicateCount, isAdmin }) {
  const [openId, setOpenId] = React.useState(null);
  const containerRef = React.useRef(null);
  const closeTimer = React.useRef(null);

  // Hover-open with a small close delay so moving the cursor from the trigger
  // into the menu (legacy PCFT behaviour) doesn't snap it shut.
  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpenId(null), 140); };
  const openGroup = (g) => { cancelClose(); setOpenId(g.items ? g.id : null); };

  // Close on outside click or Escape (touch + keyboard support)
  React.useEffect(() => {
    const onClick = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpenId(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenId(null); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      cancelClose();
    };
  }, []);

  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  // Is this group "active"? (current panel lives inside it)
  const isGroupActive = (g) => {
    if (g.panelId) return g.panelId === panel;
    return g.items?.some((it) => it.panelId === panel);
  };

  const TEAL = "#26867a";       // dark-mode adaptation of PCFT signature #194E4E
  const TEAL_BG = "#194E4E";    // original PCFT teal for active state
  const itemBase = {
    fontSize: 10, fontFamily: "inherit", cursor: "pointer", padding: "10px 16px",
    border: "none", background: "transparent", color: "#bbb", letterSpacing: 1,
    fontWeight: "bold", whiteSpace: "nowrap", transition: "all 0.12s",
  };

  // Click still works (touch devices + clicking a top-level panel item).
  const handleTopClick = (g) => {
    if (g.panelId) { setPanel(g.panelId); setOpenId(null); }
    else { setOpenId(openId === g.id ? null : g.id); }
  };

  const handleItemClick = (it) => {
    setPanel(it.panelId);
    setOpenId(null);
  };

  return (
    // NOTE: flexWrap (not overflowX:auto) — an overflow container CLIPS the
    // absolutely-positioned dropdown menus, which is what made them invisible.
    <div ref={containerRef} style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", background: "#0c0c0c", position: "relative", zIndex: 50, borderBottom: "1px solid #2a2a2a" }}>
      {groups.map((g) => {
        const active = isGroupActive(g);
        const isOpen = openId === g.id;
        return (
          <div
            key={g.id}
            style={{ position: "relative" }}
            onMouseEnter={() => openGroup(g)}
            onMouseLeave={scheduleClose}
          >
            <button
              onClick={() => handleTopClick(g)}
              style={{
                ...itemBase,
                color: active ? "#fff" : isOpen ? TEAL : "#bbb",
                background: active ? TEAL_BG : isOpen ? "#15201f" : "transparent",
                borderBottom: active ? `2px solid ${TEAL}` : "2px solid transparent",
              }}
              onMouseOver={(e) => { if (!active && !isOpen) e.currentTarget.style.color = TEAL; }}
              onMouseOut={(e) => { if (!active && !isOpen) e.currentTarget.style.color = "#bbb"; }}
            >
              {g.label}
              {g.items && <span style={{ marginLeft: 5, fontSize: 7, opacity: 0.7 }}>▾</span>}
            </button>
            {g.items && isOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, minWidth: 180, zIndex: 200,
                background: "#0a0a0a", border: "1px solid #1f2a28", borderTop: `2px solid ${TEAL}`,
                boxShadow: "0 6px 16px rgba(0,0,0,0.65)",
              }}>
                {g.items.map((it) => {
                  const itActive = it.panelId === panel;
                  return (
                    <button
                      key={it.panelId}
                      onClick={() => handleItemClick(it)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        fontSize: 10, fontFamily: "inherit", cursor: "pointer",
                        padding: "8px 14px", border: "none",
                        background: itActive ? "#15201f" : "transparent",
                        color: itActive ? TEAL : "#ddd",
                        borderLeft: itActive ? `3px solid ${TEAL}` : "3px solid transparent",
                        letterSpacing: 0.5, fontWeight: itActive ? "bold" : "normal",
                      }}
                      onMouseOver={(e) => { if (!itActive) { e.currentTarget.style.background = "#101716"; e.currentTarget.style.color = TEAL; } }}
                      onMouseOut={(e) => { if (!itActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ddd"; } }}
                    >
                      {it.label}
                      {it.withCount && duplicateCount > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 8, padding: "1px 6px", borderRadius: 8, background: "#c41e1e", color: "#fff" }}>
                          {duplicateCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


"use client";
import React, { useState, useMemo } from "react";

const BORDER = "1px solid #2a2a2a";
const INNER_BORDER = "1px solid #1e1e1e";

export default function SetupSeasonPage({
  settings,
  onUpdateSettings,
  teams,
  schedule,
  onAddGame,
  onRemoveGame,
  onGenerateSchedule,
  currentSeason,
  canEdit,
  setPanel,
}) {
  const [buildWeek, setBuildWeek] = useState(1);
  const [awayTeam, setAwayTeam] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const seasonType = settings?.seasonType || "season";
  const tournamentTeams = settings?.tournamentTeams || 12;
  const playoffsEnabled = settings?.playoffsEnabled || false;
  const gamesPerSeason = settings?.gamesPerSeason || 16;

  const hasGames = (schedule || []).length > 0;
  const hasPlayoffGames = useMemo(() => {
    const pg = settings?.playoffGames || {};
    return Object.values(pg).some((arr) => (arr || []).length > 0);
  }, [settings?.playoffGames]);
  const isLocked = hasGames || hasPlayoffGames;

  const scheduleByWeek = useMemo(() => {
    const byWeek = {};
    (schedule || []).forEach((g) => {
      const w = g.week || 0;
      if (!byWeek[w]) byWeek[w] = [];
      byWeek[w].push(g);
    });
    return byWeek;
  }, [schedule]);

  const usedWeeks = useMemo(() => {
    const weeks = Object.keys(scheduleByWeek).map(Number).filter(Boolean);
    return weeks.length ? Math.max(...weeks) : 0;
  }, [scheduleByWeek]);

  const TEAM_ABBRS = useMemo(() =>
    (teams || []).map((t) => t.abbr).filter(Boolean).sort(),
  [teams]);

  const handleAddGame = () => {
    if (awayTeam && homeTeam && awayTeam !== homeTeam) {
      onAddGame?.(buildWeek, awayTeam, homeTeam);
      setAwayTeam("");
      setHomeTeam("");
    }
  };

  const handleSeasonTypeChange = (newType) => {
    if (!canEdit || isLocked) return;
    onUpdateSettings({ seasonType: newType });
  };

  const handleTournamentFormatChange = (n) => {
    if (!canEdit) return;
    onUpdateSettings({ tournamentTeams: n });
    if (setPanel) setPanel("schedules");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#15803d" }}>⚙️ SEASON SETUP</span>
        <span style={{ fontSize: 8, color: "#666" }}>· {currentSeason}</span>
      </div>

      {isLocked && (
        <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, border: "1px solid #b45309", background: "#b4530915", fontSize: 9, color: "#f59e0b" }}>
          🔒 Season type and tournament format are locked — {hasGames ? `${(schedule || []).length} game(s) exist` : 'playoff games are entered'}. Clear all games to change.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── LEFT: Season Type + Settings ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Season Type */}
          <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>SEASON TYPE</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "season", label: "Regular Season", icon: "🏈" },
                { id: "tournament", label: "Tournament", icon: "🏆" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSeasonTypeChange(t.id)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 6, fontFamily: "inherit", fontSize: 10, fontWeight: "bold",
                    border: seasonType === t.id ? "2px solid #15803d" : BORDER,
                    background: seasonType === t.id ? "#15803d15" : "transparent",
                    color: seasonType === t.id ? "#15803d" : isLocked ? "#555" : "#888",
                    cursor: canEdit && !isLocked ? "pointer" : "default",
                    opacity: isLocked && seasonType !== t.id ? 0.4 : 1,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regular Season Settings */}
          {seasonType === "season" && (
            <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
              <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>SEASON CONFIG</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Games Per Season</div>
                <input
                  type="number"
                  value={gamesPerSeason}
                  onChange={(e) => canEdit && onUpdateSettings({ gamesPerSeason: parseInt(e.target.value) || 16 })}
                  style={{ width: 80, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Weeks Per Season</div>
                <input
                  type="number"
                  value={settings?.weeksPerSeason || 16}
                  onChange={(e) => canEdit && onUpdateSettings({ weeksPerSeason: parseInt(e.target.value) || 16 })}
                  style={{ width: 80, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: INNER_BORDER }}>
                <div>
                  <div style={{ fontSize: 9, color: "#aaa" }}>Playoff Mode</div>
                  <div style={{ fontSize: 7, color: "#555" }}>Weeks 18-21 (WC / DIV / CONF / SB)</div>
                </div>
                <button
                  onClick={() => canEdit && onUpdateSettings({ playoffsEnabled: !playoffsEnabled })}
                  style={{
                    fontSize: 8, padding: "3px 10px", borderRadius: 8,
                    border: `1px solid ${playoffsEnabled ? "#15803d" : "#333"}`,
                    background: playoffsEnabled ? "#15803d22" : "transparent",
                    color: playoffsEnabled ? "#15803d" : "#888",
                    cursor: canEdit ? "pointer" : "default",
                  }}
                >
                  {playoffsEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          )}

          {/* Tournament Settings */}
          {seasonType === "tournament" && (
            <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
              <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>TOURNAMENT FORMAT</div>
              <div style={{ fontSize: 8, color: "#666", marginBottom: 8 }}>Pick a format to go enter your bracket matchups on the Schedule page.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                {[8, 10, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleTournamentFormatChange(n)}
                    style={{
                      padding: "10px 8px", borderRadius: 6, fontFamily: "inherit", fontSize: 11, fontWeight: "bold",
                      border: tournamentTeams === n ? "2px solid #15803d" : BORDER,
                      background: tournamentTeams === n ? "#15803d15" : "transparent",
                      color: tournamentTeams === n ? "#15803d" : isLocked ? "#555" : "#888",
                      cursor: canEdit && !isLocked ? "pointer" : "default",
                      opacity: isLocked && tournamentTeams !== n ? 0.4 : 1,
                    }}
                  >
                    {n} Teams
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 8, color: "#666" }}>Custom:</span>
                <input
                  type="number"
                  min={4}
                  max={32}
                  value={tournamentTeams}
                  onChange={(e) => canEdit && onUpdateSettings({ tournamentTeams: parseInt(e.target.value) || 12 })}
                  style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}
                />
                <span style={{ fontSize: 8, color: "#666" }}>teams</span>
              </div>
              <div style={{ fontSize: 8, color: "#555", lineHeight: 1.5 }}>
                Bracket auto-generates on the Home page based on standings seeding.
                Byes: 8=0, 10=2, 12=4.
              </div>
              <button
                onClick={() => setPanel && setPanel("schedules")}
                style={{ width: "100%", marginTop: 10, padding: "8px 12px", borderRadius: 6, border: "1px solid #15803d", background: "#15803d15", color: "#15803d", fontSize: 9, fontWeight: "bold", fontFamily: "inherit", cursor: "pointer" }}
              >
                ➜ ENTER TOURNAMENT GAMES ON SCHEDULE PAGE
              </button>
            </div>
          )}

          {/* Playoff Bracket Editor */}
          <PlayoffEditor settings={settings} onUpdateSettings={onUpdateSettings} teams={teams} />
        </div>

        {/* ── RIGHT: Schedule Builder ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>
              {seasonType === "tournament" ? "TOURNAMENT BRACKET BUILDER" : "SCHEDULE BUILDER"}
            </div>

            {seasonType === "tournament" && (
              <div style={{ fontSize: 8, color: "#666", marginBottom: 8 }}>
                Use week numbers as rounds — Week 1 = Round 1, Week 2 = Round 2, etc. Enter matchups below or go to the full Schedule page.
              </div>
            )}

            {/* Week stepper */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <button onClick={() => setBuildWeek(Math.max(1, buildWeek - 1))} style={navBtn}>◀</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: "#15803d" }}>
                  {seasonType === "tournament" ? `ROUND ${buildWeek}` : `WEEK ${buildWeek}`}
                </div>
                <div style={{ fontSize: 7, color: "#555" }}>
                  {scheduleByWeek[buildWeek]?.length || 0} games
                </div>
              </div>
              <button onClick={() => setBuildWeek(buildWeek + 1)} style={navBtn}>▶</button>
            </div>

            {/* Add game form */}
            {canEdit && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 6, alignItems: "center", marginBottom: 10, padding: 8, background: "#0a0a0a", borderRadius: 6, border: INNER_BORDER }}>
                <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} style={selectStyle}>
                  <option value="">AWAY</option>
                  {TEAM_ABBRS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <span style={{ fontSize: 8, color: "#444" }}>@</span>
                <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} style={selectStyle}>
                  <option value="">HOME</option>
                  {TEAM_ABBRS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={handleAddGame} style={{ ...navBtn, color: "#15803d", border: "1px solid #15803d" }}>+</button>
              </div>
            )}

            {/* Auto-generate (regular season only) */}
            {canEdit && seasonType === "season" && (
              <button onClick={onGenerateSchedule} style={{ width: "100%", fontSize: 8, padding: "6px 10px", borderRadius: 4, border: "1px dashed #333", background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
                ⚡ AUTO-GENERATE ROUND ROBIN
              </button>
            )}

            {/* Games list */}
            <div style={{ fontSize: 8, color: "#666", marginBottom: 4 }}>
              {seasonType === "tournament" ? `ROUND ${buildWeek} MATCHUPS` : `WEEK ${buildWeek} GAMES`}
            </div>
            {(scheduleByWeek[buildWeek] || []).length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: "#555" }}>
                No {seasonType === "tournament" ? "matchups" : "games"} in {seasonType === "tournament" ? "round" : "week"} {buildWeek}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {scheduleByWeek[buildWeek].map((g, i) => (
                  <div key={g.id || i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "#0a0a0a", borderRadius: 4, border: INNER_BORDER }}>
                    <img src={`/logos/${g.away}.png`} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                    <span style={{ fontSize: 9, fontWeight: "bold", color: "#e0e0e0", flex: 1 }}>{g.away}</span>
                    <span style={{ fontSize: 8, color: "#444" }}>@</span>
                    <span style={{ fontSize: 9, fontWeight: "bold", color: "#e0e0e0", flex: 1, textAlign: "right" }}>{g.home}</span>
                    <img src={`/logos/${g.home}.png`} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                    {canEdit && (
                      <button onClick={() => onRemoveGame?.(g.id)} style={{ fontSize: 7, padding: "2px 6px", borderRadius: 3, border: "1px solid #dc2626", background: "transparent", color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule summary */}
          <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>
              {seasonType === "tournament" ? "TOURNAMENT SUMMARY" : "SCHEDULE SUMMARY"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center", padding: 8, background: "#0a0a0a", borderRadius: 4 }}>
                <div style={{ fontSize: 18, fontWeight: "bold", color: "#15803d" }}>{(schedule || []).length}</div>
                <div style={{ fontSize: 7, color: "#666" }}>TOTAL GAMES</div>
              </div>
              <div style={{ textAlign: "center", padding: 8, background: "#0a0a0a", borderRadius: 4 }}>
                <div style={{ fontSize: 18, fontWeight: "bold", color: "#3b6db5" }}>{usedWeeks}</div>
                <div style={{ fontSize: 7, color: "#666" }}>{seasonType === "tournament" ? "ROUNDS" : "WEEKS BUILT"}</div>
              </div>
            </div>
          </div>

          {/* View full schedule link */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            style={{ width: "100%", fontSize: 8, padding: "6px 10px", borderRadius: 4, border: INNER_BORDER, background: "#0a0a0a", color: "#888", cursor: "pointer", fontFamily: "inherit" }}
          >
            {showSchedule ? "HIDE" : "SHOW"} FULL {seasonType === "tournament" ? "BRACKET" : "SCHEDULE"} ({(schedule || []).length} games)
          </button>

          {showSchedule && (
            <div style={{ background: "#0c0c0c", borderRadius: 8, border: BORDER, overflow: "hidden" }}>
              {Object.keys(scheduleByWeek).sort((a, b) => Number(a) - Number(b)).map((w) => (
                <div key={w} style={{ borderBottom: INNER_BORDER }}>
                  <div style={{ fontSize: 8, fontWeight: "bold", color: "#666", padding: "4px 10px", background: "#0a0a0a" }}>
                    {seasonType === "tournament" ? `ROUND ${w}` : `WEEK ${w}`}
                  </div>
                  {scheduleByWeek[w].map((g, i) => (
                    <div key={g.id || i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", fontSize: 9 }}>
                      <img src={`/logos/${g.away}.png`} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                      <span style={{ color: "#e0e0e0" }}>{g.away}</span>
                      <span style={{ color: "#444" }}>@</span>
                      <span style={{ color: "#e0e0e0" }}>{g.home}</span>
                      <img src={`/logos/${g.home}.png`} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                      {g.awayScore != null && <span style={{ color: "#666", marginLeft: "auto" }}>{g.awayScore}-{g.homeScore}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "1px solid #333",
  background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit",
};

const selectStyle = {
  fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333",
  background: "#111", color: "#00d8a8", fontFamily: "inherit",
};

/* ═══════════ Playoff Editor (inline) ═══════════ */
function PlayoffEditor({ settings, onUpdateSettings, teams }) {
  const ROUNDS = ["wildCard", "divisional", "conference", "superBowl"];
  const ROUND_LABELS = { wildCard: "WILD CARD", divisional: "DIVISIONAL", conference: "CONFERENCE", superBowl: "SUPER BOWL" };
  const [activeRound, setActiveRound] = useState("divisional");
  const playoffGames = settings?.playoffGames || {};
  const teamOptions = (teams || []).map((t) => t.abbr).filter(Boolean).sort();

  function getGames(round) { return playoffGames[round] || []; }
  function updateGame(round, idx, field, value) {
    const games = getGames(round);
    const updated = [...games];
    updated[idx] = { ...updated[idx], [field]: value };
    onUpdateSettings({ playoffGames: { ...playoffGames, [round]: updated } });
  }
  function addGame(round) {
    const games = getGames(round);
    onUpdateSettings({ playoffGames: { ...playoffGames, [round]: [...games, { home: "", away: "", homeScore: null, awayScore: null }] } });
  }
  function removeGame(round, idx) {
    const games = getGames(round);
    onUpdateSettings({ playoffGames: { ...playoffGames, [round]: games.filter((_, i) => i !== idx) } });
  }

  return (
    <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: BORDER }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>🏈 PLAYOFF BRACKET</div>
      <div style={{ fontSize: 8, color: "#666", marginBottom: 10 }}>Wild Card is auto-generated. Enter Divisional, Conference, and Super Bowl games manually.</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {ROUNDS.map((r) => (
          <button key={r} onClick={() => setActiveRound(r)} style={{
            fontSize: 8, padding: "4px 10px", borderRadius: 4, fontFamily: "inherit", fontWeight: "bold", letterSpacing: 1,
            border: `1px solid ${activeRound === r ? "#15803d" : "#333"}`,
            background: activeRound === r ? "#15803d22" : "transparent",
            color: activeRound === r ? "#15803d" : "#888", cursor: "pointer",
          }}>{ROUND_LABELS[r]}</button>
        ))}
      </div>
      {activeRound === "wildCard" ? (
        <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: "#666" }}>Wild Card games auto-generated from standings on the Home page.</div>
      ) : (
        <div>
          {getGames(activeRound).map((game, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 1fr auto", gap: 6, alignItems: "center", marginBottom: 6, padding: 8, background: "#0a0a0a", borderRadius: 6, border: INNER_BORDER }}>
              <select value={game.home} onChange={(e) => updateGame(activeRound, idx, "home", e.target.value)} style={selectStyle}>
                <option value="">HOME</option>
                {teamOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input type="number" value={game.homeScore ?? ""} onChange={(e) => updateGame(activeRound, idx, "homeScore", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="0" style={{ ...selectStyle, textAlign: "center", color: "#fff" }} />
              <input type="number" value={game.awayScore ?? ""} onChange={(e) => updateGame(activeRound, idx, "awayScore", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="0" style={{ ...selectStyle, textAlign: "center", color: "#fff" }} />
              <select value={game.away} onChange={(e) => updateGame(activeRound, idx, "away", e.target.value)} style={selectStyle}>
                <option value="">AWAY</option>
                {teamOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={() => removeGame(activeRound, idx)} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, border: "1px solid #dc2626", background: "#dc262622", color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
            </div>
          ))}
          <button onClick={() => addGame(activeRound)} style={{ fontSize: 8, padding: "4px 12px", borderRadius: 4, border: "1px dashed #333", background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
            + ADD {ROUND_LABELS[activeRound]} GAME
          </button>
        </div>
      )}
    </div>
  );
}

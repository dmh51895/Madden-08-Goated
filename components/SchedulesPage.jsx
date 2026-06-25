"use client";
import React, { useState, useMemo } from "react";

export default function SchedulesPage({ schedule, teams, standings, navigateToTeam, gameLogs = [], onUploadGameLog, onClearGameLogs, onAddGame, onRemoveGame }) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [bWeek, setBWeek] = useState(1);
  const [bAway, setBAway] = useState("");
  const [bHome, setBHome] = useState("");
  const teamAbbrs = (teams || []).map((t) => t.abbr).filter(Boolean).sort();

  // The schedule engine emits a flat array of games; group by week here so the
  // UI can iterate even if uploaded data uses either shape.
  const weeks = useMemo(() => {
    const bucket = {};
    (schedule || []).forEach((g) => {
      if (g && Array.isArray(g.games)) {
        bucket[g.week] = bucket[g.week] || { week: g.week, games: [] };
        bucket[g.week].games.push(...g.games);
      } else if (g && g.week) {
        bucket[g.week] = bucket[g.week] || { week: g.week, games: [] };
        bucket[g.week].games.push(g);
      }
    });
    return bucket;
  }, [schedule]);

  const weekData = weeks[selectedWeek];

  const handleGameLogFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !onUploadGameLog) return;
    Promise.all(files.map((f) => f.text().then((text) => ({ text, name: f.name }))))
      .then((items) => onUploadGameLog(items));
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#7c8cff" }}>📅 SCHEDULES</span>
        <span style={{ fontSize: 8, color: "#666" }}>{gameLogs.length} game log{gameLogs.length === 1 ? "" : "s"} loaded</span>
        <div style={{ flex: 1 }} />
        <label style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #ff4444", background: "#ff444422", color: "#ff4444", cursor: "pointer" }}>
          📁 Upload .txt game logs (multi)
          <input type="file" accept=".txt" multiple onChange={handleGameLogFiles} style={{ display: "none" }} />
        </label>
        {gameLogs.length > 0 && (
          <button onClick={onClearGameLogs} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>
            Clear logs
          </button>
        )}
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#7c8cff", fontFamily: "inherit", outline: "none" }}
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
        {onAddGame && (
          <button onClick={() => setShowBuilder((s) => !s)} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #26867a", background: showBuilder ? "#15201f" : "transparent", color: "#26867a", cursor: "pointer", letterSpacing: 1 }}>
            🛠 BUILD SCHEDULE
          </button>
        )}
      </div>

      {showBuilder && onAddGame && (
        <div style={{ background: "#0c0c0c", border: "1px solid #1f2a28", borderTop: "2px solid #26867a", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#26867a", letterSpacing: 1, marginBottom: 8 }}>
            CUSTOM SCHEDULE / TOURNAMENT
          </div>
          <div style={{ fontSize: 8, color: "#666", marginBottom: 10 }}>
            Add matchups by hand — use the week number as a round (1 = round 1, etc.) for a tournament. Results come from uploaded game logs or recorded scores.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 8, color: "#888" }}>WK/RND</label>
            <input type="number" min={1} max={30} value={bWeek} onChange={(e) => setBWeek(parseInt(e.target.value) || 1)}
              style={{ width: 56, fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ddd", fontFamily: "inherit" }} />
            <select value={bAway} onChange={(e) => setBAway(e.target.value)}
              style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ddd", fontFamily: "inherit" }}>
              <option value="">Away…</option>
              {teamAbbrs.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span style={{ fontSize: 9, color: "#666" }}>@</span>
            <select value={bHome} onChange={(e) => setBHome(e.target.value)}
              style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ddd", fontFamily: "inherit" }}>
              <option value="">Home…</option>
              {teamAbbrs.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button
              onClick={async () => { await onAddGame(bWeek, bAway, bHome); setBAway(""); setBHome(""); }}
              style={{ fontSize: 9, padding: "5px 14px", borderRadius: 4, border: "none", background: "#194E4E", color: "#fff", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>
              ADD GAME
            </button>
          </div>
        </div>
      )}

      {gameLogs.length > 0 && (
        <div style={{ background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: "bold", color: "#ffd700", marginBottom: 6 }}>UPLOADED GAME LOGS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>Matchup</th>
                <th style={{ textAlign: "center", padding: "3px 6px" }}>Score</th>
                <th style={{ textAlign: "center", padding: "3px 6px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>File</th>
              </tr>
            </thead>
            <tbody>
              {gameLogs.map((g, i) => (
                <tr key={`${g.filename}-${i}`} style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <td style={{ padding: "3px 6px" }}>
                    <span style={{ color: "#aaa" }}>{g.away}</span> @ <span style={{ color: "#aaa" }}>{g.home}</span>
                  </td>
                  <td style={{ padding: "3px 6px", textAlign: "center", color: g.completed ? "#00d8a8" : "#666" }}>
                    {g.completed ? `${g.awayScore} – ${g.homeScore}` : "—"}
                  </td>
                  <td style={{ padding: "3px 6px", textAlign: "center", fontSize: 7, color: g.completed ? "#00ff88" : "#ff8800" }}>
                    {g.completed ? "FINAL" : "INCOMPLETE"}
                  </td>
                  <td style={{ padding: "3px 6px", color: "#666", fontSize: 7 }}>{g.filename}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {weekData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {weekData.games.map((game) => {
            const homeStanding = standings.find((t) => t.abbr === game.home);
            const awayStanding = standings.find((t) => t.abbr === game.away);
            const homeWon = game.played && game.winner === game.home;
            const awayWon = game.played && game.winner === game.away;

            return (
              <div
                key={game.id}
                style={{
                  background: "#0c0c0c",
                  borderRadius: 8,
                  padding: 10,
                  border: "1px solid #2a2a2a",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 8, color: "#666" }}>
                    {game.played ? `Final` : game.time || "TBD"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 7, color: "#444" }}>Wk {game.week}</span>
                    {onRemoveGame && game.id && (
                      <button
                        onClick={() => onRemoveGame(game.id)}
                        title="Remove game"
                        style={{ fontSize: 9, lineHeight: 1, padding: "1px 5px", borderRadius: 3, border: "1px solid #5a1a1a", background: "transparent", color: "#c46", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div
                    style={{ cursor: "pointer", flex: 1 }}
                    onClick={() => navigateToTeam(game.away)}
                  >
                    <span style={{ fontSize: 10, fontWeight: "bold", color: awayWon ? "#00ff88" : "#aaa" }}>
                      {game.away}
                    </span>
                    <span style={{ fontSize: 8, color: "#666", marginLeft: 4 }}>
                      ({awayStanding?.l || 0})
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: game.played ? (awayWon ? "#00ff88" : "#ff4444") : "#444", fontWeight: "bold", margin: "0 8px" }}>
                    {game.played ? game.awayScore : "@ "}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div
                    style={{ cursor: "pointer", flex: 1 }}
                    onClick={() => navigateToTeam(game.home)}
                  >
                    <span style={{ fontSize: 10, fontWeight: "bold", color: homeWon ? "#00ff88" : "#aaa" }}>
                      {game.home}
                    </span>
                    <span style={{ fontSize: 8, color: "#666", marginLeft: 4 }}>
                      ({homeStanding?.w || 0})
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: game.played ? (homeWon ? "#00ff88" : "#ff4444") : "#444", fontWeight: "bold", margin: "0 8px" }}>
                    {game.played ? game.homeScore : "vs"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!weekData && (
        <div style={{ color: "#666", fontSize: 9, padding: 40, textAlign: "center" }}>
          No games for Week {selectedWeek}. Upload schedule data or auto-generate one.
        </div>
      )}

      {/* Season Overview */}
      <div style={{ marginTop: 20, background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>SEASON OVERVIEW</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#00d8a8" }}>18</div>
            <div style={{ fontSize: 8, color: "#666" }}>WEEKS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#ff4500" }}>272</div>
            <div style={{ fontSize: 8, color: "#666" }}>GAMES</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#ffd700" }}>12</div>
            <div style={{ fontSize: 8, color: "#666" }}>TEAMS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#c77dff" }}>8</div>
            <div style={{ fontSize: 8, color: "#666" }}>DIVISIONS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#00d4ff" }}>17</div>
            <div style={{ fontSize: 8, color: "#666" }}>BYE WEEKS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#ff9d4d" }}>14</div>
            <div style={{ fontSize: 8, color: "#666" }}>PLAYOFF TEAMS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { ROLES, ROLE_LABELS } from "../data/adminRoles";

export default function SettingsPage({
  darkMode, settings, onUpdateSettings,
  currentSeason, onSeasonChange,
  onRosterUpload, onCollegesUpload, onDraftBoardUpload, onDraftPicksUpload,
  onTradeChartUpload, onPlayerStatsUpload, onStandingsUpload, onTeamStatsUpload,
  onGameLogUpload, onExportRoster, onClearAll, duplicateCount,
  currentUser, setCurrentUser, teams,
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(ROLES.VIEWER);

  const handleFile = (handler) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(handler);
  };

  // Multi-file game log upload — accept several .txt files at once.
  const handleGameLogFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !onGameLogUpload) return;
    Promise.all(files.map((f) => f.text().then((text) => ({ text, name: f.name }))))
      .then((items) => onGameLogUpload(items));
    e.target.value = ""; // allow re-selecting the same files
  };

  const handleLogin = () => {
    if (!username) return;
    setCurrentUser({ name: username, role: parseInt(role) });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#888" }}>⚙️ SETTINGS</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* League Config */}
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>LEAGUE</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>League Name</div>
            <input value={settings.leagueName || ""} onChange={(e) => onUpdateSettings({ leagueName: e.target.value })}
              style={{ width: "100%", fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Season Year</div>
            <input type="number" value={currentSeason} onChange={(e) => onSeasonChange(parseInt(e.target.value))}
              style={{ width: 100, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ffd700", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Weeks Per Season</div>
            <input type="number" value={settings.weeksPerSeason || 16} onChange={(e) => onUpdateSettings({ weeksPerSeason: parseInt(e.target.value) })}
              style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Max Roster Size</div>
            <input type="number" value={settings.maxRosterSize || 55} onChange={(e) => onUpdateSettings({ maxRosterSize: parseInt(e.target.value) })}
              style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Current Draft Rounds</div>
            <input type="number" value={settings.currentDraftRounds || 7} onChange={(e) => onUpdateSettings({ currentDraftRounds: parseInt(e.target.value) })}
              style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Future Draft Rounds</div>
            <input type="number" value={settings.futureDraftRounds || 4} onChange={(e) => onUpdateSettings({ futureDraftRounds: parseInt(e.target.value) })}
              style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
          </div>
        </div>

        {/* Feature Toggles */}
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>FEATURES</div>
          {[
            { key: "tradesEnabled", label: "Trades Enabled" },
            { key: "campsEnabled", label: "Camps Enabled" },
          ].map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: "#aaa" }}>{f.label}</span>
              <button
                onClick={() => onUpdateSettings({ [f.key]: !settings[f.key] })}
                style={{ fontSize: 8, padding: "3px 10px", borderRadius: 8, border: `1px solid ${settings[f.key] ? "#00d8a8" : "#333"}`, background: settings[f.key] ? "#00d8a822" : "transparent", color: settings[f.key] ? "#00d8a8" : "#aaa", cursor: "pointer" }}
              >
                {settings[f.key] ? "ON" : "OFF"}
              </button>
            </div>
          ))}
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginTop: 12, marginBottom: 8 }}>DISPLAY</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: "#aaa" }}>Dark Mode</span>
            <button onClick={() => onUpdateSettings({ darkMode: !darkMode })}
              style={{ fontSize: 8, padding: "3px 10px", borderRadius: 8, border: `1px solid ${darkMode ? "#00d8a8" : "#333"}`, background: darkMode ? "#00d8a822" : "transparent", color: darkMode ? "#00d8a8" : "#aaa", cursor: "pointer" }}>
              {darkMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Playoff Bracket Editor */}
        <PlayoffEditor settings={settings} onUpdateSettings={onUpdateSettings} teams={teams} />

        {/* File Uploads */}
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>📁 FILE UPLOADS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Roster (NZA)", handler: onRosterUpload, color: "#00d8a8" },
              { label: "Colleges", handler: onCollegesUpload, color: "#c77dff" },
              { label: "Draft Board", handler: onDraftBoardUpload, color: "#00d4ff" },
              { label: "Draft Picks", handler: onDraftPicksUpload, color: "#ffd700" },
              { label: "Trade Chart", handler: onTradeChartUpload, color: "#ff4500" },
              { label: "Player Stats", handler: onPlayerStatsUpload, color: "#7c8cff" },
              { label: "Standings", handler: onStandingsUpload, color: "#00ff88" },
              { label: "Team Stats", handler: onTeamStatsUpload, color: "#ff8800" },
            ].map((f) => (
              <label key={f.label} style={{ fontSize: 8, padding: "6px 8px", borderRadius: 6, border: `1px solid ${f.color}33`, background: `${f.color}11`, color: f.color, cursor: "pointer", display: "block", textAlign: "center" }}>
                📁 {f.label}
                <input type="file" accept=".csv" onChange={handleFile(f.handler)} style={{ display: "none" }} />
              </label>
            ))}
            {/* Game logs accept multiple .txt files at once and are parsed/aggregated automatically. */}
            <label style={{ fontSize: 8, padding: "6px 8px", borderRadius: 6, border: "1px solid #ff444433", background: "#ff444411", color: "#ff4444", cursor: "pointer", display: "block", textAlign: "center", gridColumn: "span 2" }}>
              📁 Game Logs (.txt, multi-select)
              <input type="file" accept=".txt" multiple onChange={handleGameLogFiles} style={{ display: "none" }} />
            </label>
          </div>

          {/* Download template */}
          <div style={{ marginTop: 8, padding: 8, background: "#0a0a0a", borderRadius: 6, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 8, color: "#888", marginBottom: 6 }}>NEED A TEMPLATE?</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a href="/templates/player-stats-template.csv" download
                style={{ fontSize: 8, padding: "4px 10px", borderRadius: 4, border: "1px solid #7c8cff", background: "#7c8cff11", color: "#7c8cff", cursor: "pointer", textDecoration: "none" }}>
                📥 Player Stats CSV
              </a>
            </div>
            <div style={{ fontSize: 7, color: "#555", marginTop: 4 }}>
              Two-row header format: category row (PASSING, RUSHING, etc.) + column names. Match team names to your roster abbreviations.
            </div>
          </div>

          {/* Export current roster as a valid NZA-editor CSV */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 9, color: "#aaa", marginBottom: 6 }}>EXPORT</div>
            <button
              onClick={onExportRoster}
              style={{ fontSize: 8, padding: "4px 10px", borderRadius: 6, border: "1px solid #00d8a8", background: "#00d8a822", color: "#00d8a8", cursor: "pointer", marginRight: 8 }}
            >
              💾 Download roster CSV (NZA-compatible)
            </button>
            {duplicateCount > 0 && (
              <span style={{ fontSize: 8, color: "#ffd700" }}>
                ⚠ {duplicateCount} duplicate name{duplicateCount === 1 ? "" : "s"} detected — fix in the Duplicates tab for accurate stats.
              </span>
            )}
          </div>
        </div>

        {/* User Login */}
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>👤 USER ACCESS</div>
          {currentUser ? (
            <div>
              <div style={{ fontSize: 9, color: "#aaa", marginBottom: 4 }}>
                Logged in as <span style={{ color: "#00d8a8" }}>{currentUser.name}</span>
              </div>
              <div style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, border: `1px solid ${["#ff4444", "#666", "#00d8a8", "#7c8cff", "#ffd700"][currentUser.role]}`, color: ["#ff4444", "#666", "#00d8a8", "#7c8cff", "#ffd700"][currentUser.role], display: "inline-block", marginBottom: 8 }}>
                Role: {ROLE_LABELS[currentUser.role]}
              </div>
              <button onClick={() => setCurrentUser(null)} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #ff4444", background: "#ff444422", color: "#ff4444", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
                  style={{ flex: 1, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", outline: "none" }} />
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}>
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== "0" && k !== "1").map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleLogin} style={{ fontSize: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #00d8a8", background: "#00d8a822", color: "#00d8a8", cursor: "pointer" }}>
                Login
              </button>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 7, color: "#666" }}>
            Roles: 0=Admin · 2=Viewer · 3=Team Owner · 4=Moderator
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ gridColumn: "1 / -1", background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #ff444433" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ff4444", marginBottom: 8 }}>⚠️ DANGER ZONE</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => onClearAll?.()}
              style={{ fontSize: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #ff4444", background: "#ff444422", color: "#ff4444", cursor: "pointer" }}
            >
              Clear All Data
            </button>
            <span style={{ fontSize: 7, color: "#666" }}>Wipes IndexedDB. You'll need to re-upload rosters.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayoffEditor({ settings, onUpdateSettings, teams }) {
  const ROUNDS = ["wildCard", "divisional", "conference", "superBowl"];
  const ROUND_LABELS = { wildCard: "WILD CARD", divisional: "DIVISIONAL", conference: "CONFERENCE", superBowl: "SUPER BOWL" };
  const [activeRound, setActiveRound] = useState("divisional");

  const playoffGames = settings?.playoffGames || {};

  const teamOptions = (teams || []).map((t) => t.abbr).filter(Boolean).sort();

  function getGames(round) {
    if (round === "wildCard") return [];
    return playoffGames[round] || [];
  }

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
    <div style={{ gridColumn: "1 / -1", background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>🏈 PLAYOFF BRACKET</div>
      <div style={{ fontSize: 8, color: "#666", marginBottom: 10 }}>
        Wild Card is auto-generated from standings. Enter Divisional, Conference, and Super Bowl games manually.
      </div>

      {/* Round Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {ROUNDS.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            style={{
              fontSize: 8, padding: "4px 10px", borderRadius: 4, fontFamily: "inherit", fontWeight: "bold", letterSpacing: 1,
              border: `1px solid ${activeRound === r ? "#15803d" : "#333"}`,
              background: activeRound === r ? "#15803d22" : "transparent",
              color: activeRound === r ? "#15803d" : "#888",
              cursor: "pointer",
            }}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Wild Card notice */}
      {activeRound === "wildCard" && (
        <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: "#666" }}>
          Wild Card games are auto-generated from standings on the Home page bracket.
        </div>
      )}

      {/* Manual rounds */}
      {activeRound !== "wildCard" && (
        <div>
          {getGames(activeRound).map((game, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 1fr auto", gap: 6, alignItems: "center", marginBottom: 6, padding: 8, background: "#0a0a0a", borderRadius: 6, border: "1px solid #2a2a2a" }}>
              <select value={game.home} onChange={(e) => updateGame(activeRound, idx, "home", e.target.value)}
                style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}>
                <option value="">HOME</option>
                {teamOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input type="number" value={game.homeScore ?? ""} onChange={(e) => updateGame(activeRound, idx, "homeScore", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="0"
                style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#fff", fontFamily: "inherit", textAlign: "center" }} />
              <input type="number" value={game.awayScore ?? ""} onChange={(e) => updateGame(activeRound, idx, "awayScore", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="0"
                style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#fff", fontFamily: "inherit", textAlign: "center" }} />
              <select value={game.away} onChange={(e) => updateGame(activeRound, idx, "away", e.target.value)}
                style={{ fontSize: 9, padding: "4px 6px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit" }}>
                <option value="">AWAY</option>
                {teamOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={() => removeGame(activeRound, idx)}
                style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, border: "1px solid #dc2626", background: "#dc262622", color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => addGame(activeRound)}
            style={{ fontSize: 8, padding: "4px 12px", borderRadius: 4, border: "1px dashed #333", background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
            + ADD {ROUND_LABELS[activeRound]} GAME
          </button>
        </div>
      )}
    </div>
  );
}

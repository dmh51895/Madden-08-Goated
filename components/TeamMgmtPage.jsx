"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS, POSITION_IDS_BY_ABBR } from "../data/maddenIds";
import { analyzeBreakdown } from "../data/rosterEngine";

export default function TeamMgmtPage({
  roster, teamFilter, setTeamFilter, teams, settings,
  onSignPlayer, onReleasePlayer, onChangePosition, onChangeJersey,
  freeAgents, toggleSettings
}) {
  const [action, setAction] = useState("roster");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [signTarget, setSignTarget] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [newPos, setNewPos] = useState("");
  const [newJersey, setNewJersey] = useState("");
  const [message, setMessage] = useState(null);

  const teamRoster = useMemo(() => {
    if (!teamFilter) return [];
    return roster.filter((p) => p.teamAbbr === teamFilter).sort((a, b) => b.overall - a.overall);
  }, [roster, teamFilter]);

  const maxRoster = settings?.maxRosterSize || 55;

  const handleSign = (playerId) => {
    if (!teamFilter) return;
    if (teamRoster.length >= maxRoster) {
      setMessage({ type: "error", text: "REJECTED — Roster is full (55/55). Must release a player first." });
      return;
    }

    const player = freeAgents.find((p) => p.playerId === playerId);
    if (!player) return;

    // Check breakdown if release is happening
    const breakdown = analyzeBreakdown(teamRoster, toggleSettings);
    const underGroups = breakdown.issues.filter((i) => i.type === "under");

    // Same-category exception
    if (releaseTarget) {
      const releasePlayer = teamRoster.find((p) => p.playerId === releaseTarget);
      if (releasePlayer && player.positionGroup === releasePlayer.positionGroup) {
        // Same group — allowed
      } else if (underGroups.length > 0) {
        setMessage({ type: "error", text: `REJECTED — Would create deficit at: ${underGroups.map((d) => d.group).join(", ")}` });
        return;
      }
    }

    onSignPlayer(playerId, teamFilter);
    setMessage({ type: "success", text: `Signed ${player.firstName} ${player.lastName} to ${teamFilter}` });
    setSignTarget(null);
  };

  const handleRelease = (playerId) => {
    const player = teamRoster.find((p) => p.playerId === playerId);
    if (!player) return;

    // Check if release would violate requirements
    const breakdown = analyzeBreakdown(teamRoster.filter((p) => p.playerId !== playerId), toggleSettings);
    const newUnder = breakdown.issues.filter((i) => i.type === "under");
    const currentUnder = analyzeBreakdown(teamRoster, toggleSettings).issues.filter((i) => i.type === "under");

    // If this release creates NEW deficits
    const newDeficits = newUnder.filter((n) => !currentUnder.some((c) => c.group === n.group));

    if (newDeficits.length > 0 && !(signTarget && teamRoster.find((p) => p.playerId === signTarget)?.positionGroup === player.positionGroup)) {
      setMessage({ type: "error", text: `REJECTED — Would violate requirements at: ${newDeficits.map((d) => d.group).join(", ")}` });
      return;
    }

    onReleasePlayer(playerId);
    setMessage({ type: "success", text: `Released ${player.firstName} ${player.lastName}` });
    setReleaseTarget(null);
  };

  const handlePositionChange = () => {
    if (!selectedPlayer || !newPos) return;
    const posId = POSITION_IDS_BY_ABBR[newPos];
    if (posId === undefined) return;
    onChangePosition(selectedPlayer, posId);
    setMessage({ type: "success", text: `Position changed to ${newPos}` });
    setNewPos("");
  };

  const handleJerseyChange = () => {
    if (!selectedPlayer || !newJersey) return;
    const num = parseInt(newJersey);
    if (isNaN(num) || num < 0 || num > 99) return;
    onChangeJersey(selectedPlayer, num);
    setMessage({ type: "success", text: `Jersey changed to #${num}` });
    setNewJersey("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#7c8cff" }}>🏈 TEAM MANAGEMENT</span>
        <div style={{ flex: 1 }} />
        <select
          value={teamFilter || ""}
          onChange={(e) => setTeamFilter(e.target.value || null)}
          style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#7c8cff", fontFamily: "inherit", outline: "none" }}
        >
          <option value="">Select Team</option>
          {teams.filter((t) => t.abbr !== "FA" && t.abbr !== "DFT").map((t) => (
            <option key={t.abbr} value={t.abbr}>{t.city} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Action Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          { id: "roster", label: "Roster", color: "#00d8a8" },
          { id: "sign", label: "Sign FA", color: "#00ff88" },
          { id: "release", label: "Release", color: "#ff4444" },
          { id: "position", label: "Position", color: "#c77dff" },
          { id: "jersey", label: "Jersey #", color: "#ffd700" },
        ].map((a) => (
          <button
            key={a.id}
            onClick={() => setAction(a.id)}
            style={{
              fontSize: 8,
              padding: "3px 8px",
              borderRadius: 8,
              border: `1px solid ${action === a.id ? a.color : "#333"}`,
              background: action === a.id ? `${a.color}22` : "transparent",
              color: action === a.id ? a.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: "6px 12px", borderRadius: 6, marginBottom: 12, fontSize: 9,
          background: message.type === "error" ? "#ff444422" : "#00d8a822",
          color: message.type === "error" ? "#ff4444" : "#00d8a8",
          border: `1px solid ${message.type === "error" ? "#ff4444" : "#00d8a8"}`,
        }}>
          {message.text}
        </div>
      )}

      {!teamFilter && <div style={{ color: "#666", fontSize: 9 }}>Select a team to manage</div>}

      {teamFilter && action === "roster" && (
        <div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>{teamRoster.length}/{maxRoster} players</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>#</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>OVR</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>AGE</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>HGT</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>WGT</th>
              </tr>
            </thead>
            <tbody>
              {teamRoster.map((p) => (
                <tr key={p.playerId} style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <td style={{ padding: "4px 6px", color: "#666" }}>{p.jerseyNumber}</td>
                  <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                  <td style={{ padding: "4px 6px", color: "#c77dff" }}>{p.positionAbbr}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center", color: p.overall >= 90 ? "#ffd700" : "#aaa" }}>{p.overall}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.age}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.heightDisplay}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {teamFilter && action === "sign" && (
        <div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>Select a free agent to sign to {teamFilter}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {freeAgents.slice(0, 50).map((p) => (
              <div key={p.playerId} style={{ background: "#0c0c0c", borderRadius: 6, padding: 8, border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: "bold" }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: 8, color: "#aaa" }}>{p.positionAbbr} · OVR {p.overall}</div>
                  </div>
                  <button
                    onClick={() => handleSign(p.playerId)}
                    style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #00ff88", background: "#00ff8822", color: "#00ff88", cursor: "pointer" }}
                  >
                    SIGN
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamFilter && action === "release" && (
        <div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>Select a player to release to Free Agents</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>OVR</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {teamRoster.map((p) => (
                <tr key={p.playerId} style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                  <td style={{ padding: "4px 6px", color: "#c77dff" }}>{p.positionAbbr}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.overall}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                    <button
                      onClick={() => handleRelease(p.playerId)}
                      style={{ fontSize: 8, padding: "2px 8px", borderRadius: 6, border: "1px solid #ff4444", background: "#ff444422", color: "#ff4444", cursor: "pointer" }}
                    >
                      RELEASE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {teamFilter && action === "position" && (
        <div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>Change player position</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              value={selectedPlayer || ""}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#c77dff", fontFamily: "inherit" }}
            >
              <option value="">Select Player</option>
              {teamRoster.map((p) => (
                <option key={p.playerId} value={p.playerId}>{p.firstName} {p.lastName} ({p.positionAbbr})</option>
              ))}
            </select>
            <select
              value={newPos}
              onChange={(e) => setNewPos(e.target.value)}
              style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#c77dff", fontFamily: "inherit" }}
            >
              <option value="">New Position</option>
              {Object.values(POSITION_IDS).map((p) => (
                <option key={p.abbr} value={p.abbr}>{p.abbr} - {p.name}</option>
              ))}
            </select>
            <button
              onClick={handlePositionChange}
              disabled={!selectedPlayer || !newPos}
              style={{ fontSize: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #c77dff", background: "#c77dff22", color: "#c77dff", cursor: "pointer", opacity: !selectedPlayer || !newPos ? 0.5 : 1 }}
            >
              APPLY
            </button>
          </div>
        </div>
      )}

      {teamFilter && action === "jersey" && (
        <div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>Change jersey number</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              value={selectedPlayer || ""}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ffd700", fontFamily: "inherit" }}
            >
              <option value="">Select Player</option>
              {teamRoster.map((p) => (
                <option key={p.playerId} value={p.playerId}>{p.firstName} {p.lastName} (#{p.jerseyNumber})</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              max="99"
              value={newJersey}
              onChange={(e) => setNewJersey(e.target.value)}
              placeholder="0-99"
              style={{ width: 60, fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#111", color: "#ffd700", fontFamily: "inherit" }}
            />
            <button
              onClick={handleJerseyChange}
              disabled={!selectedPlayer || !newJersey}
              style={{ fontSize: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #ffd700", background: "#ffd70022", color: "#ffd700", cursor: "pointer", opacity: !selectedPlayer || !newJersey ? 0.5 : 1 }}
            >
              APPLY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

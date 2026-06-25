"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS } from "../data/maddenIds";

export default function FreeAgentsPage({ freeAgents, teams, navigateToPlayer, onSignPlayer, teamFilter, setTeamFilter, settings }) {
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [signTarget, setSignTarget] = useState(null);
  const [showAllTeams, setShowAllTeams] = useState(false);

  const positions = ["ALL", "QB", "HB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "LE", "RE", "DT", "LOLB", "MLB", "ROLB", "CB", "FS", "SS", "K", "P"];

  const filtered = useMemo(() => {
    if (positionFilter === "ALL") return freeAgents;
    return freeAgents.filter((p) => p.positionAbbr === positionFilter);
  }, [freeAgents, positionFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.overall - a.overall), [filtered]);

  const handleSign = (playerId, targetTeam) => {
    onSignPlayer(playerId, targetTeam);
    setSignTarget(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#00ff88" }}>🆓 FREE AGENTS</span>
        <span style={{ fontSize: 8, color: "#666" }}>{filtered.length} players</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowAllTeams(!showAllTeams)}
          style={{
            fontSize: 8, padding: "3px 8px", borderRadius: 8,
            border: `1px solid ${showAllTeams ? "#00ff88" : "#333"}`,
            background: showAllTeams ? "#00ff8822" : "transparent",
            color: showAllTeams ? "#00ff88" : "#aaa",
            cursor: "pointer",
          }}
        >
          {showAllTeams ? "HIDE TEAMS" : "SHOW TEAMS"}
        </button>
        {showAllTeams && (
          <select
            value={signTarget || ""}
            onChange={(e) => setSignTarget(e.target.value || null)}
            style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#00ff88", fontFamily: "inherit", outline: "none" }}
          >
            <option value="">Select team to sign to</option>
            {teams.filter((t) => t.abbr !== "FA" && t.abbr !== "DFT").map((t) => (
              <option key={t.abbr} value={t.abbr}>{t.city} {t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Position Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {positions.map((pos) => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            style={{
              fontSize: 7, padding: "2px 6px", borderRadius: 6,
              border: `1px solid ${positionFilter === pos ? "#00ff88" : "#222"}`,
              background: positionFilter === pos ? "#00ff8822" : "transparent",
              color: positionFilter === pos ? "#00ff88" : "#888",
              cursor: "pointer",
            }}
          >
            {pos}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Player</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>Age</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>OVR</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>SPD</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>HGT</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>WGT</th>
            {signTarget && <th style={{ textAlign: "center", padding: "4px 6px" }}>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr
              key={p.playerId}
              style={{ cursor: "pointer", borderBottom: "1px solid #2a2a2a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}
              onClick={() => navigateToPlayer(p.playerId)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0c0c0c" : "transparent")}
            >
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>
                #{p.jerseyNumber} {p.firstName} {p.lastName}
              </td>
              <td style={{ padding: "4px 6px", color: "#c77dff" }}>{p.positionAbbr}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.age}</td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: p.overall >= 90 ? "#ffd700" : p.overall >= 80 ? "#00d8a8" : "#aaa" }}>
                {p.overall}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.speed}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.heightDisplay}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.weight}</td>
              {signTarget && (
                <td style={{ padding: "4px 6px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleSign(p.playerId, signTarget)}
                    style={{ fontSize: 8, padding: "2px 8px", borderRadius: 6, border: "1px solid #00ff88", background: "#00ff8822", color: "#00ff88", cursor: "pointer" }}
                  >
                    SIGN
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div style={{ color: "#666", fontSize: 9, padding: 40, textAlign: "center" }}>
          No free agents. Upload a roster CSV in Settings.
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS } from "../data/maddenIds";

export default function LeadersPage({ roster = [], playerStats = [], colleges, navigateToPlayer }) {
  const [category, setCategory] = useState("PASSING");
  const [statKey, setStatKey] = useState("passYards");

  const categories = {
    PASSING: { label: "Passing", stats: ["passYards", "passTD", "passCompletions", "interceptions"], color: "#00d8a8" },
    RUSHING: { label: "Rushing", stats: ["rushYards", "rushTD", "rushAttempts"], color: "#ff4500" },
    RECEIVING: { label: "Receiving", stats: ["recYards", "recTD", "receptions"], color: "#7c8cff" },
    DEFENSE: { label: "Defense", stats: ["tackles", "sacks", "defensiveInterceptions"], color: "#ff4444" },
    KICKING: { label: "Kicking", stats: ["fgMade", "xpMade"], color: "#ffd700" },
    RETURNS: { label: "Returns", stats: ["kickReturnYards", "puntReturnYards"], color: "#c77dff" },
  };

  const cat = categories[category] || categories.PASSING;

  // Merge roster data with stats data
  const leaders = useMemo(() => {
    const safeStats = playerStats || [];
    const safeRoster = roster || [];
    if (safeStats.length > 0) {
      // Use uploaded stats
      return [...safeStats]
        .filter((p) => p[statKey] > 0)
        .sort((a, b) => b[statKey] - a[statKey])
        .slice(0, 25)
        .map((p) => ({
          ...p,
          name: p.playerName,
          overall: safeRoster.find((r) => r.firstName + " " + r.lastName === p.playerName)?.overall || 0,
        }));
    }
    // Fallback to roster attributes
    return [...safeRoster]
      .filter((p) => {
        if (statKey === "passYards" || statKey === "passTD") return p.positionAbbr === "QB";
        if (statKey === "rushYards" || statKey === "rushTD") return ["QB", "HB", "FB"].includes(p.positionAbbr);
        if (statKey === "recYards" || statKey === "recTD") return ["WR", "TE", "HB"].includes(p.positionAbbr);
        if (statKey === "tackles" || statKey === "sacks") return ["LE", "RE", "DT", "LOLB", "MLB", "ROLB", "CB", "FS", "SS"].includes(p.positionAbbr);
        return true;
      })
      .sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0))
      .slice(0, 25);
  }, [roster, playerStats, statKey]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ffd700" }}>🏆 LEADERS</span>
        <div style={{ flex: 1 }} />
        {Object.entries(categories).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setCategory(key); setStatKey(val.stats[0]); }}
            style={{
              fontSize: 8, padding: "3px 8px", borderRadius: 8,
              border: `1px solid ${category === key ? val.color : "#333"}`,
              background: category === key ? `${val.color}22` : "transparent",
              color: category === key ? val.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {val.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {cat.stats.map((s) => (
          <button
            key={s}
            onClick={() => setStatKey(s)}
            style={{
              fontSize: 8, padding: "3px 8px", borderRadius: 8,
              border: `1px solid ${statKey === s ? cat.color : "#333"}`,
              background: statKey === s ? `${cat.color}22` : "transparent",
              color: statKey === s ? cat.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {s.replace(/([A-Z])/g, " $1").toUpperCase()}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>#</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Player</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>GP</th>
            <th style={{ textAlign: "center", padding: "4px 6px", color: cat.color }}>
              {statKey.replace(/([A-Z])/g, " $1").toUpperCase()}
            </th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((p, i) => (
            <tr
              key={i}
              style={{ cursor: "pointer", borderBottom: "1px solid #2a2a2a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}
              onClick={() => navigateToPlayer(p.playerId || p.playerName)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0c0c0c" : "transparent")}
            >
              <td style={{ padding: "4px 6px", color: i < 3 ? "#ffd700" : "#666" }}>{i + 1}</td>
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.name || p.playerName}</td>
              <td style={{ padding: "4px 6px", color: "#ff4500" }}>{p.team || p.teamAbbr}</td>
              <td style={{ padding: "4px 6px", color: "#aaa" }}>{p.position || p.positionAbbr}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.gamesPlayed || "-"}</td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: cat.color, fontWeight: "bold" }}>
                {(p[statKey] || 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {leaders.length === 0 && (
        <div style={{ color: "#666", fontSize: 9, padding: 40, textAlign: "center" }}>
          No stats data. Upload player stats CSV in Settings.
        </div>
      )}
    </div>
  );
}

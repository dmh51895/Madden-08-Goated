"use client";
import React, { useState } from "react";

export default function CoachesPage({ coaches, teams, navigateToTeam }) {
  const [sortBy, setSortBy] = useState("wins");

  const sorted = [...coaches].sort((a, b) => {
    if (sortBy === "wins") return b.wins - a.wins;
    if (sortBy === "titles") return b.titles - a.titles;
    if (sortBy === "years") return b.yearsCoaching - a.yearsCoaching;
    return 0;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#5865F2" }}>👔 COACHES</span>
        <div style={{ flex: 1 }} />
        {[
          { id: "wins", label: "Wins", color: "#00d8a8" },
          { id: "titles", label: "Titles", color: "#ffd700" },
          { id: "years", label: "Experience", color: "#c77dff" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSortBy(s.id)}
            style={{
              fontSize: 8,
              padding: "3px 8px",
              borderRadius: 8,
              border: `1px solid ${sortBy === s.id ? s.color : "#333"}`,
              background: sortBy === s.id ? `${s.color}22` : "transparent",
              color: sortBy === s.id ? s.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>#</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Coach</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>W</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>L</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>Years</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>Apps</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>Titles</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr
              key={c.id}
              style={{
                borderBottom: "1px solid #1a1a1a",
                background: i % 2 === 0 ? "#0c0c0c" : "transparent",
              }}
            >
              <td style={{ padding: "4px 6px", color: i < 3 ? "#ffd700" : "#666" }}>{i + 1}</td>
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{c.name}</td>
              <td
                style={{ padding: "4px 6px", color: "#ff4500", cursor: "pointer" }}
                onClick={() => navigateToTeam(c.team)}
              >
                {c.team}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: "#00d8a8" }}>{c.wins}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{c.losses}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{c.yearsCoaching}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{c.playoffApps}</td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: c.titles > 0 ? "#ffd700" : "#666" }}>
                {c.titles}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 10, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>MOST WINS</div>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#00d8a8" }}>{sorted[0]?.name}</div>
          <div style={{ fontSize: 8, color: "#aaa" }}>{sorted[0]?.team} · {sorted[0]?.wins} wins</div>
        </div>
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 10, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>MOST TITLES</div>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#ffd700" }}>
            {[...sorted].sort((a, b) => b.titles - a.titles)[0]?.name}
          </div>
          <div style={{ fontSize: 8, color: "#aaa" }}>
            {[...sorted].sort((a, b) => b.titles - a.titles)[0]?.titles} championships
          </div>
        </div>
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 10, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>MOST EXPERIENCED</div>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#c77dff" }}>
            {[...sorted].sort((a, b) => b.yearsCoaching - a.yearsCoaching)[0]?.name}
          </div>
          <div style={{ fontSize: 8, color: "#aaa" }}>
            {[...sorted].sort((a, b) => b.yearsCoaching - a.yearsCoaching)[0]?.yearsCoaching} years
          </div>
        </div>
      </div>
    </div>
  );
}

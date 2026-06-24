"use client";
import React, { useState, useMemo } from "react";

export default function RecordsPage({ roster, playerStats, colleges, navigateToPlayer }) {
  const [category, setCategory] = useState("overall");

  const categories = [
    { id: "overall", label: "Overall", stat: "overall", color: "#ffd700" },
    { id: "speed", label: "Speed", stat: "speed", color: "#00d8a8" },
    { id: "passing", label: "Passing", stat: "throwAccuracy", color: "#7c8cff" },
    { id: "rushing", label: "Rushing", stat: "carry", color: "#ff4500" },
    { id: "receiving", label: "Receiving", stat: "catch", color: "#c77dff" },
    { id: "tackling", label: "Tackling", stat: "tackle", color: "#ff4444" },
  ];

  const cat = categories.find((c) => c.id === category);

  const leaders = useMemo(() => {
    return [...roster]
      .filter((p) => p[cat.stat] > 0)
      .sort((a, b) => b[cat.stat] - a[cat.stat])
      .slice(0, 20);
  }, [roster, cat.stat]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff9d4d" }}>📜 RECORDS</span>
        <div style={{ flex: 1 }} />
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              fontSize: 8, padding: "3px 8px", borderRadius: 8,
              border: `1px solid ${category === c.id ? c.color : "#333"}`,
              background: category === c.id ? `${c.color}22` : "transparent",
              color: category === c.id ? c.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #1a1a1a" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: cat.color, marginBottom: 8 }}>
          {cat.label.toUpperCase()} LEADERS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Rank</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Player</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>Age</th>
              <th style={{ textAlign: "right", padding: "4px 6px" }}>{cat.stat.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((p, i) => (
              <tr
                key={p.playerId}
                style={{
                  borderBottom: "1px solid #1a1a1a",
                  background: i % 2 === 0 ? "#0c0c0c" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => navigateToPlayer(p.playerId)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a2a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0c0c0c" : "transparent")}
              >
                <td style={{ padding: "4px 6px", color: i < 3 ? "#ffd700" : "#666", fontWeight: i < 3 ? "bold" : "normal" }}>
                  {i + 1}
                </td>
                <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                <td style={{ padding: "4px 6px", color: "#ff4500" }}>{p.teamAbbr}</td>
                <td style={{ padding: "4px 6px", color: "#aaa" }}>{p.positionAbbr}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{p.age}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: cat.color, fontWeight: "bold" }}>
                  {p[cat.stat]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top at each position */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {["QB", "HB", "WR", "TE"].map((pos) => {
          const top = [...roster].filter((p) => p.positionAbbr === pos).sort((a, b) => b.overall - a.overall)[0];
          return top ? (
            <div key={pos} style={{ background: "#0c0c0c", borderRadius: 8, padding: 10, border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>TOP {pos}</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#ffd700" }}>{top.firstName} {top.lastName}</div>
              <div style={{ fontSize: 8, color: "#aaa" }}>{top.teamAbbr} · OVR {top.overall}</div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

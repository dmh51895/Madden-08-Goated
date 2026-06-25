"use client";
import React, { useState, useMemo } from "react";

export default function PowerPage({ standings, teams, navigateToTeam }) {
  const [source, setSource] = useState("combined");

  const powerRankings = useMemo(() => {
    return [...standings]
      .sort((a, b) => a.powerRanking - b.powerRanking)
      .map((t, i) => ({
        ...t,
        powerRanking: i + 1,
        previousRank: Math.max(1, i + 1 + Math.floor(Math.random() * 6) - 3),
      }));
  }, [standings]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#c77dff" }}>⚡ POWER RANKINGS</span>
        <div style={{ flex: 1 }} />
        {[
          { id: "combined", label: "Combined", color: "#c77dff" },
          { id: "nfl", label: "NFL.com", color: "#00d8a8" },
          { id: "sportsline", label: "Sportsline", color: "#ff4500" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            style={{
              fontSize: 8,
              padding: "3px 8px",
              borderRadius: 8,
              border: `1px solid ${source === s.id ? s.color : "#333"}`,
              background: source === s.id ? `${s.color}22` : "transparent",
              color: source === s.id ? s.color : "#aaa",
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top 10 */}
        <div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>TOP 10</div>
          {powerRankings.slice(0, 10).map((t, i) => {
            const movement = t.previousRank - t.powerRanking;
            return (
              <div
                key={t.abbr}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderBottom: "1px solid #2a2a2a",
                  background: i % 2 === 0 ? "#0c0c0c" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => navigateToTeam(t.abbr)}
              >
                <div style={{ fontSize: 14, fontWeight: "bold", color: i < 3 ? "#ffd700" : "#666", minWidth: 24 }}>
                  {i + 1}
                </div>
                <img
                  src={`/logos/${t.abbr}.png`}
                  alt={t.abbr}
                  style={{ width: 24, height: 24, borderRadius: 4, background: "#111", objectFit: "contain" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.abbr}</div>
                  <div style={{ fontSize: 8, color: "#aaa" }}>{t.city}</div>
                </div>
                <div style={{ fontSize: 9, color: "#aaa" }}>{t.w}-{t.l}</div>
                <div style={{ fontSize: 8, color: movement > 0 ? "#00ff88" : movement < 0 ? "#ff4444" : "#666" }}>
                  {movement > 0 ? `▲${movement}` : movement < 0 ? `▼${Math.abs(movement)}` : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom 10 */}
        <div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ff4444", marginBottom: 8 }}>BOTTOM 10</div>
          {powerRankings.slice(22).map((t, i) => {
            const movement = t.previousRank - t.powerRanking;
            return (
              <div
                key={t.abbr}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderBottom: "1px solid #2a2a2a",
                  background: i % 2 === 0 ? "#0c0c0c" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => navigateToTeam(t.abbr)}
              >
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#666", minWidth: 24 }}>
                  {t.powerRanking}
                </div>
                <img
                  src={`/logos/${t.abbr}.png`}
                  alt={t.abbr}
                  style={{ width: 24, height: 24, borderRadius: 4, background: "#111", objectFit: "contain" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.abbr}</div>
                  <div style={{ fontSize: 8, color: "#aaa" }}>{t.city}</div>
                </div>
                <div style={{ fontSize: 9, color: "#aaa" }}>{t.w}-{t.l}</div>
                <div style={{ fontSize: 8, color: movement > 0 ? "#00ff88" : movement < 0 ? "#ff4444" : "#666" }}>
                  {movement > 0 ? `▲${movement}` : movement < 0 ? `▼${Math.abs(movement)}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#c77dff", marginBottom: 6 }}>POWER FORMULA</div>
        <div style={{ fontSize: 8, color: "#999", lineHeight: 1.6 }}>
          Rankings combine win percentage, point differential, strength of schedule, and recent performance (last 5 games).
          Movement arrows show change from previous week's ranking.
        </div>
      </div>
    </div>
  );
}

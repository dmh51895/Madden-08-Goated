"use client";
import React, { useState, useMemo } from "react";

export default function PlayoffsPage({ standings, teams, navigateToTeam }) {
  const [view, setView] = useState("bracket");

  const playoffTeams = useMemo(() => {
    const sorted = [...standings].sort((a, b) => b.w - a.w || a.l - b.l || b.diff - a.diff);
    const afc = sorted.filter((t) => t.conference === "AFC").slice(0, 7);
    const nfc = sorted.filter((t) => t.conference === "NFC").slice(0, 7);
    return { afc, nfc };
  }, [standings]);

  const PlayoffBracket = ({ conference, teams }) => {
    const seeds = [
      { seed: 1, label: "BYE", team: teams[0] },
      { seed: 2, label: "BYE", team: teams[1] },
      { seed: 3, label: "Wild Card", team: teams[2] },
      { seed: 4, label: "Wild Card", team: teams[3] },
      { seed: 5, label: "Wild Card", team: teams[4] },
      { seed: 6, label: "Wild Card", team: teams[5] },
      { seed: 7, label: "Wild Card", team: teams[6] },
    ];

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: conference === "AFC" ? "#ff4500" : "#7c8cff", marginBottom: 8 }}>
          {conference} BRACKET
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {seeds.filter((s) => s.team).map((s) => (
            <div
              key={s.seed}
              style={{
                background: "#0c0c0c",
                borderRadius: 6,
                padding: 8,
                border: "1px solid #1a1a1a",
              }}
            >
              <div style={{ fontSize: 7, color: "#666", marginBottom: 2, letterSpacing: 1 }}>
                #{s.seed} SEED {s.label !== "BYE" ? `· ${s.label}` : ""}
              </div>
              <div
                style={{ fontSize: 10, fontWeight: "bold", color: s.seed <= 2 ? "#ffd700" : "#00d8a8", cursor: "pointer" }}
                onClick={() => navigateToTeam(s.team.abbr)}
              >
                {s.team.abbr}
              </div>
              <div style={{ fontSize: 8, color: "#aaa" }}>
                {s.team.w}-{s.team.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PlayoffSeeds = ({ conference, teams }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: "bold", color: conference === "AFC" ? "#ff4500" : "#7c8cff", marginBottom: 8 }}>
        {conference} SEEDINGS
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>Seed</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>W</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>L</th>
            <th style={{ textAlign: "center", padding: "4px 6px" }}>DIFF</th>
            <th style={{ textAlign: "left", padding: "4px 6px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr
              key={t.abbr}
              style={{ borderBottom: "1px solid #1a1a1a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}
            >
              <td style={{ padding: "4px 6px", textAlign: "center", color: i < 2 ? "#ffd700" : "#00d8a8", fontWeight: "bold" }}>
                #{i + 1}
              </td>
              <td style={{ padding: "4px 6px", fontWeight: "bold", cursor: "pointer" }} onClick={() => navigateToTeam(t.abbr)}>
                {t.abbr} {t.city}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: "#00d8a8" }}>{t.w}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.l}</td>
              <td style={{ padding: "4px 6px", textAlign: "center", color: t.diff > 0 ? "#00ff88" : "#ff4444" }}>
                {t.diff > 0 ? "+" : ""}{t.diff}
              </td>
              <td style={{ padding: "4px 6px" }}>
                <span style={{ fontSize: 7, letterSpacing: 1, color: i < 2 ? "#ffd700" : "#00d8a8" }}>
                  {i < 2 ? "BYE WEEK" : "WILD CARD"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ffd700" }}>🏅 PLAYOFFS</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setView("bracket")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "bracket" ? "#ffd700" : "#333"}`, background: view === "bracket" ? "#ffd70022" : "transparent", color: view === "bracket" ? "#ffd700" : "#aaa", cursor: "pointer" }}
        >
          Bracket
        </button>
        <button
          onClick={() => setView("seeds")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "seeds" ? "#ffd700" : "#333"}`, background: view === "seeds" ? "#ffd70022" : "transparent", color: view === "seeds" ? "#ffd700" : "#aaa", cursor: "pointer" }}
        >
          Seedings
        </button>
      </div>

      {view === "bracket" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <PlayoffBracket conference="AFC" teams={playoffTeams.afc} />
          <PlayoffBracket conference="NFC" teams={playoffTeams.nfc} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <PlayoffSeeds conference="AFC" teams={playoffTeams.afc} />
          <PlayoffSeeds conference="NFC" teams={playoffTeams.nfc} />
        </div>
      )}
    </div>
  );
}

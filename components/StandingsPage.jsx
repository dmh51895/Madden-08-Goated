"use client";
import React, { useState, useMemo } from "react";
import { DIVISIONS, annotateStandingsWithDivisions } from "../data/divisions";
import { teamColor, teamAccent } from "../data/teamColors";

export default function StandingsPage({ standings, teams, navigateToTeam, year }) {
  const [view, setView] = useState("division");

  // Annotate every standings row with conference/division from the lookup
  // if those fields aren't already present (the standings CSV typically
  // doesn't carry them, so the divisional view would otherwise be empty).
  const annotated = useMemo(
    () => annotateStandingsWithDivisions(standings || []),
    [standings]
  );

  const getDivisionTeams = (conf, div) =>
    annotated.filter((t) => t.conference === conf && t.division === div)
      .sort((a, b) => b.w - a.w || a.l - b.l || (b.diff || 0) - (a.diff || 0));

  const DivisionTable = ({ conference, division }) => {
    const divTeams = getDivisionTeams(conference, division);
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", marginBottom: 4, letterSpacing: 1 }}>
          {conference} {division}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid #333`, color: "#aaa" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>#</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>W</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>L</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>T</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>PF</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>PA</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>DIFF</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>DIV</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>CONF</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>L5</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>STRK</th>
            </tr>
          </thead>
          <tbody>
            {divTeams.map((t, i) => (
              <tr
                key={t.abbr}
                style={{
                  borderBottom: `1px solid #2a2a2a`,
                  cursor: "pointer",
                  background: i % 2 === 0 ? "#0c0c0c" : "transparent",
                }}
                onClick={() => navigateToTeam(t.abbr)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a2a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0c0c0c" : "transparent")}
              >
                <td style={{ padding: "4px 6px", color: "#666" }}>#{t.powerRanking}</td>
                <td style={{ padding: "4px 6px", fontWeight: "bold" }}>
                  <span style={{ color: "#B10002" }}>{t.abbr}</span> {t.city}
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center", color: "#15803d" }}>{t.w}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.l}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.t}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.pf}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.pa}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", color: t.diff > 0 ? "#00ff88" : "#ff4444" }}>
                  {t.diff > 0 ? "+" : ""}{t.diff}
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.divW}-{t.divL}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.confW}-{t.confL}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{t.last5}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", color: t.streak.startsWith("W") ? "#00ff88" : "#ff4444" }}>
                  {t.streak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (view === "conference") {
    const conferences = ["AFC", "NFC"];
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: "bold", color: "#d4a017" }}>📊 STANDINGS</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setView("division")}
            style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}
          >
            Division View
          </button>
          <button
            onClick={() => setView("conference")}
            style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #15803d", background: "#15803d22", color: "#15803d", cursor: "pointer" }}
          >
            Conference View
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {conferences.map((conf) => (
            <div key={conf}>
              <div style={{ fontSize: 11, fontWeight: "bold", color: conf === "AFC" ? "#B10002" : "#013577", marginBottom: 8 }}>
                {conf} STANDINGS
              </div>
              {DIVISIONS[conf].map((div) => (
                <DivisionTable key={`${conf}-${div}`} conference={conf} division={div} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#d4a017" }}>📊 STANDINGS</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setView("division")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #15803d", background: "#15803d22", color: "#15803d", cursor: "pointer" }}
        >
          Division View
        </button>
        <button
          onClick={() => setView("conference")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}
        >
          Conference View
        </button>
      </div>

      <div style={{ fontSize: 8, color: "#999", marginBottom: 8 }}>
        x = Clinched playoff berth · y = Clinched division · z = Home-field advantage
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          {DIVISIONS.AFC.map((div) => (
            <DivisionTable key={`AFC-${div}`} conference="AFC" division={div} />
          ))}
        </div>
        <div>
          {DIVISIONS.NFC.map((div) => (
            <DivisionTable key={`NFC-${div}`} conference="NFC" division={div} />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { downloadCSV } from "../data/csvParser";

export default function DraftPage({ draftBoard, draftPicks, teams, colleges, settings, onImport, onImportPicks }) {
  const [selectedRound, setSelectedRound] = useState(1);
  const [view, setView] = useState("board");
  const maxRounds = settings?.currentDraftRounds || 7;

  const roundPicks = draftPicks.filter((p) => p.round === selectedRound);
  const roundBoard = draftBoard.filter((p) => p.round === selectedRound);

  // Format: "Team (Owner) [Original]"
  const formatCell = (team, owner, original) => {
    if (!team) return <span style={{ color: "#444" }}>TBD</span>;
    return (
      <span>
        <span style={{ color: "#ff4500" }}>{team}</span>
        {owner && <span style={{ color: "#aaa" }}> ({owner})</span>}
        {original && <span style={{ color: "#666" }}> [{original}]</span>}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#00d4ff" }}>📋 DRAFT</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setView("board")} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "board" ? "#00d4ff" : "#333"}`, background: view === "board" ? "#00d4ff22" : "transparent", color: view === "board" ? "#00d4ff" : "#aaa", cursor: "pointer" }}>Rookies</button>
        <button onClick={() => setView("picks")} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "picks" ? "#00d4ff" : "#333"}`, background: view === "picks" ? "#00d4ff22" : "transparent", color: view === "picks" ? "#00d4ff" : "#aaa", cursor: "pointer" }}>Picks</button>
        <label style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>
          📁 Board
          <input type="file" accept=".csv" onChange={(e) => e.target.files[0] && e.target.files[0].text().then(onImport)} style={{ display: "none" }} />
        </label>
        <label style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>
          📁 Picks
          <input type="file" accept=".csv" onChange={(e) => e.target.files[0] && e.target.files[0].text().then(onImportPicks)} style={{ display: "none" }} />
        </label>
        <button onClick={() => downloadCSV(view === "board" ? roundBoard : roundPicks, `draft-round-${selectedRound}.csv`)} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>💾 Export</button>
      </div>

      <select value={selectedRound} onChange={(e) => setSelectedRound(parseInt(e.target.value))}
        style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#00d4ff", fontFamily: "inherit", outline: "none", marginBottom: 12 }}>
        {Array.from({ length: maxRounds }, (_, i) => i + 1).map((r) => (
          <option key={r} value={r}>Round {r}</option>
        ))}
      </select>

      {view === "board" ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Pick</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Player</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>College</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>OVR</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Team</th>
            </tr>
          </thead>
          <tbody>
            {roundBoard.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid #2a2a2a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}>
                <td style={{ padding: "4px 6px", color: "#ffd700", fontWeight: "bold" }}>{p.pick || i + 1}</td>
                <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                <td style={{ padding: "4px 6px", color: "#c77dff" }}>{p.position}</td>
                <td style={{ padding: "4px 6px", color: "#666" }}>{p.college}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", color: p.overall >= 90 ? "#ffd700" : "#aaa" }}>{p.overall}</td>
                <td style={{ padding: "4px 6px", color: "#ff4500" }}>{p.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Pick</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Team (Owner) [Original]</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Player</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Pos</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>College</th>
            </tr>
          </thead>
          <tbody>
            {roundPicks.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid #2a2a2a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}>
                <td style={{ padding: "4px 6px", color: "#ffd700", fontWeight: "bold" }}>{p.pick || i + 1}</td>
                <td style={{ padding: "4px 6px" }}>{formatCell(p.team, p.owner, p.originalTeam)}</td>
                <td style={{ padding: "4px 6px", fontWeight: "bold" }}>{p.player || "TBD"}</td>
                <td style={{ padding: "4px 6px", color: "#c77dff" }}>{p.position || "-"}</td>
                <td style={{ padding: "4px 6px", color: "#666" }}>{p.college || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(view === "board" ? roundBoard : roundPicks).length === 0 && (
        <div style={{ color: "#666", fontSize: 9, padding: 40, textAlign: "center" }}>
          No draft data. Upload CSV files in Settings.
        </div>
      )}
    </div>
  );
}

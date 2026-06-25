"use client";
import React, { useState, useMemo } from "react";
import { TEAM_IDS } from "../data/maddenIds";
import { downloadCSV } from "../data/csvParser";

export default function TradeChartPage({ tradeChart, draftPicks, teams, onImport, settings, currentUser }) {
  const [view, setView] = useState("chart");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const maxRounds = settings?.currentDraftRounds || 7;

  const chart = useMemo(() => {
    if (tradeChart.length > 0) return tradeChart;
    // Generate default chart
    return teams.filter((t) => t.abbr !== "FA" && t.abbr !== "DFT").map((t) => ({
      id: t.abbr,
      originalTeam: t.abbr,
      round1: t.abbr,
      round2: t.abbr,
      round3: t.abbr,
      round4: t.abbr,
      future1: "",
      future2: "",
      future3: "",
      future4: "",
    }));
  }, [tradeChart, teams]);

  const filteredChart = selectedTeam
    ? chart.filter((c) => c.originalTeam === selectedTeam)
    : chart;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onImport(ev.target.result);
    };
    reader.readAsText(file);
  };

  const exportChart = () => {
    downloadCSV(chart, `trade-chart-${settings?.currentSeason || 2024}.csv`);
  };

  // Format: "Team (Owner) [Original]"
  const formatCell = (cell) => {
    if (!cell) return <span style={{ color: "#444" }}>—</span>;
    // If it matches pattern "Team (Owner) [Original]"
    const match = cell.match(/^(\w+)\s*\(([^)]+)\)\s*\[(\w+)\]$/);
    if (match) {
      return (
        <span>
          <span style={{ color: "#ff4500" }}>{match[1]}</span>
          <span style={{ color: "#aaa" }}> ({match[2]})</span>
          <span style={{ color: "#666" }}> [{match[3]}]</span>
        </span>
      );
    }
    // Just a team name
    return <span style={{ color: "#ff4500" }}>{cell}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#00d4ff" }}>🔄 TRADE CHART</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setView("chart")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "chart" ? "#00d4ff" : "#333"}`, background: view === "chart" ? "#00d4ff22" : "transparent", color: view === "chart" ? "#00d4ff" : "#aaa", cursor: "pointer" }}
        >
          Chart
        </button>
        <button
          onClick={() => setView("draft")}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: `1px solid ${view === "draft" ? "#00d4ff" : "#333"}`, background: view === "draft" ? "#00d4ff22" : "transparent", color: view === "draft" ? "#00d4ff" : "#aaa", cursor: "pointer" }}
        >
          Draft Order
        </button>
        <label style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>
          📁 Import CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>
        <button
          onClick={exportChart}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}
        >
          💾 Export
        </button>
      </div>

      {/* Team Filter */}
      <div style={{ marginBottom: 12 }}>
        <select
          value={selectedTeam || ""}
          onChange={(e) => setSelectedTeam(e.target.value || null)}
          style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#00d4ff", fontFamily: "inherit", outline: "none" }}
        >
          <option value="">All Teams</option>
          {teams.filter((t) => t.abbr !== "FA" && t.abbr !== "DFT").map((t) => (
            <option key={t.abbr} value={t.abbr}>{t.abbr} - {t.city} {t.name}</option>
          ))}
        </select>
      </div>

      {view === "chart" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>TEAM</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>1ST</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>2ND</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>3RD</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>4TH</th>
                <th style={{ textAlign: "center", padding: "4px 6px", color: "#ffd700" }}>FUT 1ST</th>
                <th style={{ textAlign: "center", padding: "4px 6px", color: "#ffd700" }}>FUT 2ND</th>
                <th style={{ textAlign: "center", padding: "4px 6px", color: "#ffd700" }}>FUT 3RD</th>
                <th style={{ textAlign: "center", padding: "4px 6px", color: "#ffd700" }}>FUT 4TH</th>
              </tr>
            </thead>
            <tbody>
              {filteredChart.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #2a2a2a", background: i % 2 === 0 ? "#0c0c0c" : "transparent" }}>
                  <td style={{ padding: "4px 6px", fontWeight: "bold", color: "#ff4500" }}>{row.originalTeam}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.round1)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.round2)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.round3)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.round4)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.future1)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.future2)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.future3)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{formatCell(row.future4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "draft" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#ffd700", marginBottom: 8 }}>DRAFT ORDER</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
            {Array.from({ length: maxRounds }, (_, r) => r + 1).map((round) => (
              <div key={round} style={{ background: "#0c0c0c", borderRadius: 8, padding: 10, border: "1px solid #2a2a2a" }}>
                <div style={{ fontSize: 9, fontWeight: "bold", color: round <= 4 ? "#ffd700" : "#00d4ff", marginBottom: 6 }}>
                  ROUND {round}
                </div>
                {chart.map((row, i) => {
                  const cell = round === 1 ? row.round1 : round === 2 ? row.round2 : round === 3 ? row.round3 : round === 4 ? row.round4 : "";
                  if (!cell) return null;
                  return (
                    <div key={row.id} style={{ fontSize: 8, padding: "2px 0", borderBottom: "1px solid #2a2a2a" }}>
                      <span style={{ color: "#666" }}>{i + 1}.</span>{" "}
                      {formatCell(cell)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: 12, fontSize: 8, color: "#666" }}>
        Format: Team (Owner) [Original Pick] · Future picks shown in gold · Click team in dropdown to filter
      </div>
    </div>
  );
}

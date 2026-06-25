"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS, ROSTER_REQUIREMENTS } from "../data/maddenIds";
import { getBreakdownDisplay, analyzeBreakdown } from "../data/rosterEngine";

export default function BreakdownPage({ roster, settings, onUpdateSettings, teamFilter, setTeamFilter, teams }) {
  const toggleSettings = settings?.toggleSettings || {};

  const teamRoster = useMemo(() => {
    if (!teamFilter) return roster;
    return roster.filter((p) => p.teamAbbr === teamFilter);
  }, [roster, teamFilter]);

  const breakdown = useMemo(
    () => getBreakdownDisplay(teamRoster, toggleSettings),
    [teamRoster, toggleSettings]
  );

  const totalPlayers = teamRoster.length;
  const maxRoster = settings?.maxRosterSize || 55;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff9d4d" }}>📋 ROSTER BREAKDOWN</span>
        <div style={{ flex: 1 }} />
        <select
          value={teamFilter || ""}
          onChange={(e) => setTeamFilter(e.target.value || null)}
          style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#ff9d4d", fontFamily: "inherit", outline: "none" }}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.abbr} value={t.abbr}>{t.city} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Roster Count */}
      <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 10, color: "#666" }}>ROSTER SIZE</span>
            <span style={{ fontSize: 14, fontWeight: "bold", color: totalPlayers > maxRoster ? "#ff4444" : "#00d8a8", marginLeft: 8 }}>
              {totalPlayers}
            </span>
            <span style={{ fontSize: 10, color: "#666" }}> / {maxRoster}</span>
          </div>
          <div style={{ fontSize: 8, color: totalPlayers > maxRoster ? "#ff4444" : "#666" }}>
            {totalPlayers > maxRoster ? "OVER LIMIT — must release players" : `${maxRoster - totalPlayers} spots available`}
          </div>
        </div>
      </div>

      {/* Group Toggles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {["FB", "TE", "OLB", "MLB", "DE", "DT"].map((group) => (
          <button
            key={group}
            onClick={() => onUpdateSettings({ toggleSettings: { ...toggleSettings, [group]: !toggleSettings[group] } })}
            style={{
              fontSize: 8,
              padding: "3px 8px",
              borderRadius: 8,
              border: `1px solid ${toggleSettings[group] !== false ? "#00d8a8" : "#333"}`,
              background: toggleSettings[group] !== false ? "#00d8a822" : "transparent",
              color: toggleSettings[group] !== false ? "#00d8a8" : "#666",
              cursor: "pointer",
            }}
          >
            {group} {toggleSettings[group] !== false ? "ON" : "OFF"}
          </button>
        ))}
      </div>

      {/* Breakdown Table */}
      <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>GROUP</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>REQUIRED</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>CURRENT</th>
              <th style={{ textAlign: "center", padding: "4px 6px" }}>STATUS</th>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>POSITION BREAKDOWN</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => {
              const isOk = row.status === "ok";
              const isUnder = row.status === "under";
              const isOver = row.status === "over";
              const isToggleable = row.toggleable && !row.toggleEnabled;

              return (
                <tr
                  key={row.group}
                  style={{
                    borderBottom: "1px solid #2a2a2a",
                    background: isToggleable ? "#0a0a0a" : isUnder ? "#1a0a0a" : isOver ? "#0a1a0a" : "transparent",
                    opacity: isToggleable ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: "4px 6px", fontWeight: "bold", color: isOk ? "#00d8a8" : isUnder ? "#ff4444" : "#ff8800" }}>
                    {row.group}
                    {isToggleable && <span style={{ fontSize: 7, color: "#666", marginLeft: 4 }}>(disabled)</span>}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center", color: "#aaa" }}>{row.required}</td>
                  <td style={{ padding: "4px 6px", textAlign: "center", color: isOk ? "#00d8a8" : isUnder ? "#ff4444" : "#ff8800", fontWeight: "bold" }}>
                    {row.current}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                    <span style={{
                      fontSize: 7,
                      letterSpacing: 1,
                      padding: "2px 6px",
                      borderRadius: 6,
                      color: isOk ? "#00d8a8" : isUnder ? "#ff4444" : "#ff8800",
                      background: isOk ? "#00d8a822" : isUnder ? "#ff444422" : "#ff880022",
                    }}>
                      {isToggleable ? "N/A" : isOk ? "OK" : isUnder ? "DEFICIT" : "OVER"}
                    </span>
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {row.positions.map((pos) => (
                        <span key={pos.posId} style={{ fontSize: 8, color: pos.count > 0 ? "#aaa" : "#444" }}>
                          {pos.abbr}: <span style={{ color: pos.count > 0 ? "#00d8a8" : "#ff4444" }}>{pos.count}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 8, color: "#666" }}>
        <div><span style={{ color: "#00d8a8" }}>■</span> OK — meets minimum</div>
        <div><span style={{ color: "#ff4444" }}>■</span> DEFICIT — below minimum</div>
        <div><span style={{ color: "#ff8800" }}>■</span> OVER — exceeds reasonable limit</div>
        <div><span style={{ color: "#666" }}>■</span> N/A — group toggle disabled</div>
      </div>
    </div>
  );
}

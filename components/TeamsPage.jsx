"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS, TEAM_IDS } from "../data/maddenIds";
import { teamColor, teamAccent } from "../data/teamColors";

export default function TeamsPage({ teams, standings, roster, colleges, selectedTeam, navigateToPlayer, settings, toggleSettings }) {
  const [teamFilter, setTeamFilter] = useState(selectedTeam || teams[0]?.abbr || "CHI");

  const teamInfo = teams.find((t) => t.abbr === teamFilter);
  const teamStanding = standings.find((t) => t.abbr === teamFilter);
  const teamRoster = useMemo(() => roster.filter((p) => p.teamAbbr === teamFilter), [roster, teamFilter]);
  const tc = teamColor(teamFilter);

  const rosterByPos = useMemo(() => {
    const groups = {};
    teamRoster.forEach((p) => {
      const pos = p.positionAbbr || "QB";
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(p);
    });
    Object.keys(groups).forEach((pos) => groups[pos].sort((a, b) => b.overall - a.overall));
    return groups;
  }, [teamRoster]);

  // Position groupings ordered like real depth charts
  const POSITION_ORDER = ["QB","HB","FB","WR","TE","LT","LG","C","RG","RT","LE","RE","DT","LOLB","MLB","ROLB","CB","FS","SS","K","P"];
  const orderedPositions = POSITION_ORDER.filter((p) => rosterByPos[p]?.length).concat(
    Object.keys(rosterByPos).filter((p) => !POSITION_ORDER.includes(p))
  );

  // Compute roster totals (used for the breakdown sidebar)
  const teamAvgOverall = teamRoster.length
    ? Math.round(teamRoster.reduce((s, p) => s + (p.overall || 0), 0) / teamRoster.length)
    : 0;
  const top5Overall = [...teamRoster].sort((a, b) => (b.overall || 0) - (a.overall || 0)).slice(0, 5);

  const ratingColor = (v) => v >= 90 ? "#d4a017" : v >= 80 ? "#15803d" : v >= 70 ? "#3b6db5" : "#aaa";

  return (
    <div>
      {/* ── Team banner (original PCFT .t_<Team> pattern) ── */}
      <div style={{
        background: tc.bg, color: tc.fg,
        borderRadius: 8, padding: "16px 20px", marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        border: `1px solid ${tc.bg}`,
        boxShadow: `0 0 20px ${tc.bg}55`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>{teamFilter}</span>
          <span style={{ fontSize: 18 }}>
            {teamInfo ? `${teamInfo.city} ${teamInfo.name}` : tc.name}
          </span>
          {teamStanding && (
            <span style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1 }}>
              {teamStanding.w}-{teamStanding.l}{teamStanding.t ? `-${teamStanding.t}` : ""}
              {teamStanding.diff != null && <span style={{ opacity: 0.7 }}> · {teamStanding.diff > 0 ? "+" : ""}{teamStanding.diff} diff</span>}
            </span>
          )}
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={{
            fontSize: 11, padding: "4px 8px", borderRadius: 4,
            border: `1px solid ${tc.fg}55`, background: "rgba(0,0,0,0.3)",
            color: tc.fg, fontFamily: "inherit", outline: "none", fontWeight: "bold",
          }}
        >
          {teams.map((t) => (
            <option key={t.abbr} value={t.abbr} style={{ background: "#111", color: "#fff" }}>
              {t.city} {t.name}
            </option>
          ))}
        </select>
      </div>

      {teamInfo ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2.4fr)", gap: 14 }}>
          {/* ── Left sidebar: team summary ──────────────────── */}
          <div>
            {/* Quick stats card */}
            <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 14, border: `1px solid #1a1a1a`, borderLeft: `3px solid ${tc.bg}` }}>
              <div style={{ fontSize: 10, fontWeight: "bold", color: tc.fg === "#FFFFFF" ? teamAccent(teamFilter) : tc.bg, marginBottom: 10, letterSpacing: 1 }}>
                TEAM SUMMARY
              </div>
              <Stat label="Roster" value={`${teamRoster.length} players`} />
              <Stat label="Avg OVR" value={teamAvgOverall} valueColor={ratingColor(teamAvgOverall)} />
              {teamStanding && (
                <>
                  <Stat label="Record" value={`${teamStanding.w}-${teamStanding.l}${teamStanding.t ? `-${teamStanding.t}` : ""}`} valueColor="#15803d" />
                  <Stat label="Points For" value={teamStanding.pf || 0} />
                  <Stat label="Points Agst" value={teamStanding.pa || 0} />
                  <Stat label="Differential" value={`${(teamStanding.diff || 0) > 0 ? "+" : ""}${teamStanding.diff || 0}`}
                        valueColor={(teamStanding.diff || 0) > 0 ? "#22c55e" : (teamStanding.diff || 0) < 0 ? "#dc2626" : "#aaa"} />
                  {teamStanding.powerRanking && <Stat label="Power Rank" value={`#${teamStanding.powerRanking}`} />}
                </>
              )}
            </div>

            {/* Top players */}
            {top5Overall.length > 0 && (
              <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 14, border: "1px solid #1a1a1a", marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", marginBottom: 8, letterSpacing: 1 }}>
                  TOP 5 BY OVERALL
                </div>
                {top5Overall.map((p) => (
                  <div
                    key={p.playerId}
                    onClick={() => navigateToPlayer(p.playerId)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "4px 6px", borderRadius: 4, cursor: "pointer",
                      borderBottom: "1px solid #161616",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <div style={{ fontSize: 9, fontWeight: "bold", color: "#ddd" }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: 7, color: "#666" }}>{p.positionAbbr} · #{p.jerseyNumber}</div>
                    </div>
                    <div style={{ fontSize: 11, color: ratingColor(p.overall), fontWeight: "bold" }}>{p.overall}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Roster breakdown by position */}
            <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 14, border: "1px solid #1a1a1a", marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", marginBottom: 8, letterSpacing: 1 }}>
                ROSTER BREAKDOWN
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                {POSITION_ORDER.map((pos) => {
                  const count = (rosterByPos[pos] || []).length;
                  if (!count) return null;
                  return (
                    <div key={pos} style={{ display: "flex", justifyContent: "space-between", fontSize: 8, padding: "2px 4px" }}>
                      <span style={{ color: "#aaa", fontWeight: "bold" }}>{pos}</span>
                      <span style={{ color: count >= 2 ? "#15803d" : "#dc2626", fontWeight: "bold" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: full roster by position ────────────── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", marginBottom: 8, letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span>ROSTER — {teamRoster.length} PLAYERS</span>
              <span style={{ fontSize: 8, color: "#666" }}>click any row → player profile</span>
            </div>
            {orderedPositions.map((pos) => {
              const players = rosterByPos[pos] || [];
              return (
                <div key={pos} style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 10, fontWeight: "bold", letterSpacing: 1,
                    color: tc.fg === "#FFFFFF" ? teamAccent(teamFilter) : tc.bg,
                    background: "#0c0c0c", borderLeft: `3px solid ${tc.bg}`,
                    padding: "4px 10px", marginBottom: 4, borderRadius: 3,
                  }}>
                    {pos} <span style={{ color: "#666", fontWeight: "normal" }}>({players.length})</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                        <th style={{ textAlign: "left", padding: "3px 6px" }}>#</th>
                        <th style={{ textAlign: "left", padding: "3px 6px" }}>Name</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>OVR</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>SPD</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>AWR</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>AGE</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>HGT</th>
                        <th style={{ textAlign: "center", padding: "3px 6px" }}>WGT</th>
                        <th style={{ textAlign: "left", padding: "3px 6px" }}>College</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, i) => (
                        <tr
                          key={p.playerId}
                          style={{
                            cursor: "pointer", borderBottom: "1px solid #161616",
                            background: i === 0 ? `${tc.bg}11` : "transparent",
                          }}
                          onClick={() => navigateToPlayer(p.playerId)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? `${tc.bg}11` : "transparent")}
                        >
                          <td style={{ padding: "3px 6px", color: "#666" }}>{p.jerseyNumber}</td>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", color: "#e0e0e0" }}>
                            {i === 0 && <span style={{ color: "#d4a017", marginRight: 4 }}>★</span>}
                            {p.firstName} {p.lastName}
                          </td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: ratingColor(p.overall), fontWeight: "bold" }}>
                            {p.overall}
                          </td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: "#bbb" }}>{p.speed}</td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: "#bbb" }}>{p.awareness}</td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: "#bbb" }}>{p.age}</td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: "#aaa" }}>{p.heightDisplay}</td>
                          <td style={{ padding: "3px 6px", textAlign: "center", color: "#aaa" }}>{p.weight}</td>
                          <td style={{ padding: "3px 6px", color: "#666", fontSize: 8 }}>
                            {colleges?.[p.collegeId] || p.collegeId || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {teamRoster.length === 0 && (
              <div style={{ color: "#666", fontSize: 10, padding: 30, textAlign: "center", background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a" }}>
                No roster data for {teamFilter}. Upload a roster CSV in Settings.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: "#666", fontSize: 10, padding: 30, textAlign: "center" }}>
          Select a team.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 9, borderBottom: "1px solid #141414" }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: valueColor || "#ddd", fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

"use client";
import React, { useState, useMemo } from "react";
import { POSITION_IDS, TEAM_IDS } from "../data/maddenIds";
import { teamColor, teamAccent } from "../data/teamColors";

const POSITION_ORDER = ["QB","HB","FB","WR","TE","LT","LG","C","RG","RT","LE","RE","DT","LOLB","MLB","ROLB","CB","FS","SS","K","P"];
const ratingColor = (v) => v >= 90 ? "#d4a017" : v >= 80 ? "#15803d" : v >= 70 ? "#3b6db5" : "#aaa";

export default function TeamsPage({
  teams, standings, roster, colleges, selectedTeam, navigateToPlayer, settings, toggleSettings,
  teamStats = [], draftPicks = [], playerStats = [], gameLogs = [], schedule = [], allSeasons = {}, year,
}) {
  const [teamFilter, setTeamFilter] = useState(selectedTeam || teams[0]?.abbr || "CHI");
  const [view, setView] = useState("home"); // "home" | "roster"

  // Sync teamFilter when selectedTeam changes from outside (e.g. logo click)
  React.useEffect(() => {
    if (selectedTeam && selectedTeam !== teamFilter) {
      setTeamFilter(selectedTeam);
      setView("home");
    }
  }, [selectedTeam]);

  const teamInfo = teams.find((t) => t.abbr === teamFilter);
  const teamStanding = standings.find((t) => t.abbr === teamFilter);
  const tc = teamColor(teamFilter);
  const accent = tc.fg === "#FFFFFF" ? teamAccent(teamFilter) : tc.bg;
  const teamName = teamInfo ? `${teamInfo.city} ${teamInfo.name}` : tc.name;

  const teamRoster = useMemo(() => roster.filter((p) => p.teamAbbr === teamFilter), [roster, teamFilter]);

  const rosterByPos = useMemo(() => {
    const groups = {};
    teamRoster.forEach((p) => { const pos = p.positionAbbr || "QB"; (groups[pos] = groups[pos] || []).push(p); });
    Object.keys(groups).forEach((pos) => groups[pos].sort((a, b) => b.overall - a.overall));
    return groups;
  }, [teamRoster]);
  const orderedPositions = POSITION_ORDER.filter((p) => rosterByPos[p]?.length)
    .concat(Object.keys(rosterByPos).filter((p) => !POSITION_ORDER.includes(p)));

  const teamAvgOverall = teamRoster.length ? Math.round(teamRoster.reduce((s, p) => s + (p.overall || 0), 0) / teamRoster.length) : 0;
  const top5Overall = [...teamRoster].sort((a, b) => (b.overall || 0) - (a.overall || 0)).slice(0, 5);

  // Stats for this team's players: match by aggregated `team` OR by roster name.
  const teamNameSet = useMemo(() => new Set(teamRoster.map((p) => `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase())), [teamRoster]);
  const teamPlayerStats = useMemo(() => (playerStats || []).filter((s) => {
    const nm = (s.playerName || "").trim().toLowerCase();
    return (s.team && String(s.team).toUpperCase().includes(teamFilter)) || teamNameSet.has(nm);
  }), [playerStats, teamNameSet, teamFilter]);

  // Team Stats CSV row for this team (match abbr / city / name).
  const teamStatRow = useMemo(() => {
    const want = [teamFilter, teamInfo?.city, teamInfo?.name, tc.name].filter(Boolean).map((s) => String(s).toLowerCase());
    return (teamStats || []).find((r) => { const t = String(r.team || "").toLowerCase(); return want.some((w) => t.includes(w) || w.includes(t)); });
  }, [teamStats, teamFilter, teamInfo, tc.name]);

  // This team's draft picks (best-effort across unknown shapes).
  const teamPicks = useMemo(() => (draftPicks || []).filter((p) => {
    const blob = JSON.stringify(p).toLowerCase();
    return [teamFilter, teamInfo?.city, teamInfo?.name].filter(Boolean).some((w) => blob.includes(String(w).toLowerCase()));
  }), [draftPicks, teamFilter, teamInfo]);

  const rookies = useMemo(() => teamRoster.filter((p) => (p.yearsPro ?? 99) === 0).sort((a, b) => b.overall - a.overall), [teamRoster]);

  // This team's schedule (matchups where home/away is this team's abbr OR name).
  const teamGames = useMemo(() => {
    const flat = [];
    (schedule || []).forEach((g) => { if (Array.isArray(g.games)) flat.push(...g.games); else if (g && g.week) flat.push(g); });
    const ids = new Set([teamFilter, teamName, teamInfo?.name].filter(Boolean));
    return flat.filter((g) => ids.has(g.home) || ids.has(g.away)).sort((a, b) => (a.week || 0) - (b.week || 0));
  }, [schedule, teamFilter, teamName, teamInfo]);

  // Year-by-year history: any season with a standings array, plus the live current one.
  const history = useMemo(() => {
    const rows = [];
    const seen = new Set();
    Object.keys(allSeasons || {}).map(Number).sort((a, b) => a - b).forEach((yr) => {
      const st = (allSeasons[yr]?.standings || []).find((t) => t.abbr === teamFilter);
      if (st) { rows.push({ year: yr, ...st }); seen.add(yr); }
    });
    if (teamStanding && !seen.has(year)) rows.push({ year, ...teamStanding });
    return rows;
  }, [allSeasons, teamFilter, teamStanding, year]);

  const Card = ({ title, color, children, right }) => (
    <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ background: `${color || accent}1a`, borderBottom: `1px solid ${color || accent}33`, padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 1, color: color || accent }}>{title}</span>
        {right}
      </div>
      <div style={{ padding: "10px 12px" }}>{children}</div>
    </div>
  );

  const num = (v) => (v == null || v === "" ? "—" : v);

  return (
    <div>
      {/* ── Team banner ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(110deg, #000 0%, ${tc.bg} 70%)`, color: tc.fg,
        borderRadius: 8, padding: "14px 18px", marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        boxShadow: `0 0 22px ${tc.bg}55`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <img src={`/logos/${teamFilter}.png`} alt="" width={40} height={40}
               onError={(e) => { e.currentTarget.style.display = "none"; }}
               style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            {teamStanding?.powerRanking ? <span style={{ fontSize: 22, fontWeight: "bold", fontStyle: "italic", opacity: 0.8 }}>#{teamStanding.powerRanking}</span> : null}
            <span style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>{teamName}</span>
            {teamStanding && (
              <span style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1 }}>
                {teamStanding.w}-{teamStanding.l}{teamStanding.t ? `-${teamStanding.t}` : ""}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["home", "roster"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{ fontSize: 9, fontWeight: "bold", letterSpacing: 1, padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                       border: `1px solid ${tc.fg}55`, background: view === v ? tc.fg : "rgba(0,0,0,0.3)", color: view === v ? tc.bg : tc.fg }}>
              {v === "home" ? "TEAM HOME" : "ROSTER"}
            </button>
          ))}
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
            style={{ fontSize: 11, padding: "5px 8px", borderRadius: 4, border: `1px solid ${tc.fg}55`, background: "rgba(0,0,0,0.3)", color: tc.fg, fontFamily: "inherit", fontWeight: "bold" }}>
            {teams.map((t) => (<option key={t.abbr} value={t.abbr} style={{ background: "#111", color: "#fff" }}>{t.city} {t.name}</option>))}
          </select>
        </div>
      </div>

      {!teamInfo ? (
        <div style={{ color: "#666", fontSize: 10, padding: 30, textAlign: "center" }}>Select a team.</div>
      ) : view === "home" ? (
        // ── TEAM HOME ──────────────────────────────────────────
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
            {/* LEFT */}
            <div>
              <Card title={`${teamFilter} GM PROFILE`}>
                <Row label="GM Name" value={num(teamInfo.owner || teamInfo.gm)} />
                <Row label="Coach" value={num(teamInfo.coach)} />
                <Row label="Avg Roster OVR" value={teamAvgOverall || "—"} valueColor={ratingColor(teamAvgOverall)} />
                <Row label="Roster Size" value={`${teamRoster.length} players`} />
              </Card>

              <Card title={`${teamFilter} TRADE BLOCK`}>
                <div style={{ fontSize: 9, color: "#777" }}>Trade block is empty.</div>
              </Card>

              <Card title={`${teamFilter} HOLDS THESE PICKS`}>
                {teamPicks.length ? teamPicks.slice(0, 12).map((p, i) => (
                  <Row key={i} label={p.round ? `Round ${p.round}` : (p.Round ? `Round ${p.Round}` : `Pick ${i + 1}`)}
                       value={num(p.projected || p.pick || p.Pick || p.overall || p.player || "")} />
                )) : <div style={{ fontSize: 9, color: "#777" }}>No tracked picks for {teamFilter}.</div>}
              </Card>

              <Card title="INJURY REPORT">
                <div style={{ fontSize: 9, color: "#777" }}>No injuries reported. (Track injuries in the Injuries tab.)</div>
              </Card>
            </div>

            {/* RIGHT */}
            <div>
              <Card title="TEAM STATS">
                {teamStatRow ? (
                  <div>
                    {Object.entries(teamStatRow)
                      .filter(([k, v]) => !["team", "games", "passingYards", "rushingYards", "totalOffense", "turnovers", "timeOfPossession"].includes(k) && k !== "Team" && v !== "" && v != null)
                      .slice(0, 28)
                      .map(([k, v]) => (<Row key={k} label={k.replace(/_/g, " ")} value={String(v)} />))}
                  </div>
                ) : <div style={{ fontSize: 9, color: "#777" }}>Upload a Team Stats CSV to populate this.</div>}
              </Card>

              <Card title={`${teamFilter} ROOKIE CLASS`}>
                {rookies.length ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                    <thead><tr style={{ color: "#666", borderBottom: "1px solid #222" }}>
                      <th style={th}>POS</th><th style={{ ...th, textAlign: "left" }}>PLAYER</th><th style={th}>AGE</th><th style={th}>OVR</th>
                    </tr></thead>
                    <tbody>{rookies.slice(0, 12).map((p) => (
                      <tr key={p.playerId} onClick={() => navigateToPlayer(p.playerId)} style={{ cursor: "pointer", borderBottom: "1px solid #161616" }}>
                        <td style={td}>{p.positionAbbr}</td>
                        <td style={{ ...td, textAlign: "left", fontWeight: "bold", color: "#ddd" }}>{p.firstName} {p.lastName}</td>
                        <td style={td}>{p.age}</td>
                        <td style={{ ...td, color: ratingColor(p.overall), fontWeight: "bold" }}>{p.overall}</td>
                      </tr>))}</tbody>
                  </table>
                ) : <div style={{ fontSize: 9, color: "#777" }}>No rookies (years pro = 0) on the roster.</div>}
              </Card>
            </div>
          </div>

          {/* SCHEDULE */}
          <Card title={`${teamFilter} SCHEDULE`}>
            {teamGames.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                <thead><tr style={{ color: "#666", borderBottom: "1px solid #222" }}>
                  <th style={{ ...th, textAlign: "left" }}>WK</th><th style={{ ...th, textAlign: "left" }}>OPPONENT</th><th style={{ ...th, textAlign: "right" }}>RESULT</th>
                </tr></thead>
                <tbody>{teamGames.map((g, i) => {
                  const isHome = g.home === teamFilter || g.home === teamName || g.home === teamInfo?.name;
                  const opp = isHome ? g.away : g.home;
                  const res = g.played || g.completed
                    ? `${isHome ? g.homeScore : g.awayScore}-${isHome ? g.awayScore : g.homeScore}`
                    : (g.time || "—");
                  return (<tr key={g.id || i} style={{ borderBottom: "1px solid #161616" }}>
                    <td style={{ ...td, textAlign: "left", color: "#888" }}>{g.week}</td>
                    <td style={{ ...td, textAlign: "left" }}>{isHome ? "vs " : "at "}{opp}</td>
                    <td style={{ ...td, textAlign: "right", color: "#bbb" }}>{res}</td>
                  </tr>);
                })}</tbody>
              </table>
            ) : <div style={{ fontSize: 9, color: "#777" }}>No schedule for {year}. Build one in the Schedules tab or upload game logs.</div>}
          </Card>

          {/* YEAR-BY-YEAR HISTORY */}
          {history.length > 0 && (
            <Card title="YEAR-BY-YEAR">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                <thead><tr style={{ color: "#666", borderBottom: "1px solid #222" }}>
                  <th style={{ ...th, textAlign: "left" }}>YEAR</th><th style={th}>W</th><th style={th}>L</th><th style={th}>T</th><th style={th}>PF</th><th style={th}>PA</th>
                </tr></thead>
                <tbody>{history.map((h) => (
                  <tr key={h.year} style={{ borderBottom: "1px solid #161616", background: h.year === year ? `${tc.bg}22` : "transparent" }}>
                    <td style={{ ...td, textAlign: "left", fontWeight: "bold" }}>{h.year}</td>
                    <td style={td}>{h.w || 0}</td><td style={td}>{h.l || 0}</td><td style={td}>{h.t || 0}</td>
                    <td style={td}>{h.pf || 0}</td><td style={td}>{h.pa || 0}</td>
                  </tr>))}</tbody>
              </table>
            </Card>
          )}

          {/* PLAYER STAT TABLES */}
          {teamPlayerStats.length > 0 && (
            <>
              <StatTable title="PASSING" color="#15803d" rows={teamPlayerStats.filter((s) => (s.passAttempts || s.passYards))}
                cols={[["CMP", "passCompletions"], ["ATT", "passAttempts"], ["YDS", "passYards"], ["TD", "passTD"], ["LONG", "passLong"]]} nav={navigateToPlayer} />
              <StatTable title="RUSHING" color="#c41e1e" rows={teamPlayerStats.filter((s) => (s.rushAttempts || s.rushYards))}
                cols={[["ATT", "rushAttempts"], ["YDS", "rushYards"], ["TD", "rushTD"], ["LONG", "rushLong"], ["FUM", "fumbles"]]} nav={navigateToPlayer} />
              <StatTable title="RECEIVING" color="#3b6db5" rows={teamPlayerStats.filter((s) => (s.receptions || s.recYards))}
                cols={[["REC", "receptions"], ["YDS", "recYards"], ["TD", "recTD"], ["LONG", "recLong"], ["YAC", "yac"]]} nav={navigateToPlayer} />
            </>
          )}
        </div>
      ) : (
        // ── ROSTER VIEW (depth chart by position) ──────────────
        <div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: accent, marginBottom: 8, letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span>ROSTER — {teamRoster.length} PLAYERS</span>
            <span style={{ fontSize: 8, color: "#666" }}>click any row → player profile</span>
          </div>
          {orderedPositions.map((pos) => {
            const players = rosterByPos[pos] || [];
            return (
              <div key={pos} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 1, color: accent, background: "#0c0c0c", borderLeft: `3px solid ${tc.bg}`, padding: "4px 10px", marginBottom: 4, borderRadius: 3 }}>
                  {pos} <span style={{ color: "#666", fontWeight: "normal" }}>({players.length})</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                  <thead><tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                    <th style={{ ...th, textAlign: "left" }}>#</th><th style={{ ...th, textAlign: "left" }}>Name</th>
                    <th style={th}>OVR</th><th style={th}>SPD</th><th style={th}>AWR</th><th style={th}>AGE</th>
                    <th style={th}>HGT</th><th style={th}>WGT</th><th style={{ ...th, textAlign: "left" }}>College</th>
                  </tr></thead>
                  <tbody>{players.map((p, i) => (
                    <tr key={p.playerId} style={{ cursor: "pointer", borderBottom: "1px solid #161616", background: i === 0 ? `${tc.bg}11` : "transparent" }}
                        onClick={() => navigateToPlayer(p.playerId)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? `${tc.bg}11` : "transparent")}>
                      <td style={{ ...td, textAlign: "left", color: "#666" }}>{p.jerseyNumber}</td>
                      <td style={{ ...td, textAlign: "left", fontWeight: "bold", color: "#e0e0e0" }}>
                        {i === 0 && <span style={{ color: "#d4a017", marginRight: 4 }}>★</span>}{p.firstName} {p.lastName}
                      </td>
                      <td style={{ ...td, color: ratingColor(p.overall), fontWeight: "bold" }}>{p.overall}</td>
                      <td style={{ ...td, color: "#bbb" }}>{p.speed}</td>
                      <td style={{ ...td, color: "#bbb" }}>{p.awareness}</td>
                      <td style={{ ...td, color: "#bbb" }}>{p.age}</td>
                      <td style={{ ...td, color: "#aaa" }}>{p.heightDisplay}</td>
                      <td style={{ ...td, color: "#aaa" }}>{p.weight}</td>
                      <td style={{ ...td, textAlign: "left", color: "#666", fontSize: 8 }}>{colleges?.[p.collegeId] || p.collegeId || "-"}</td>
                    </tr>))}</tbody>
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
      )}
    </div>
  );
}

const th = { textAlign: "center", padding: "3px 6px" };
const td = { textAlign: "center", padding: "3px 6px" };

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 9, borderBottom: "1px solid #141414" }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: valueColor || "#ddd", fontWeight: "bold", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatTable({ title, color, rows, cols, nav }) {
  if (!rows || !rows.length) return null;
  const sortKey = cols[2]?.[1] || cols[1]?.[1];
  const sorted = [...rows].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  return (
    <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ background: `${color}1a`, borderBottom: `1px solid ${color}33`, padding: "7px 12px", fontSize: 10, fontWeight: "bold", letterSpacing: 1, color }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead><tr style={{ color: "#666", borderBottom: "1px solid #222" }}>
          <th style={{ ...th, textAlign: "left", padding: "4px 10px" }}>PLAYER</th>
          {cols.map(([lbl]) => <th key={lbl} style={th}>{lbl}</th>)}
        </tr></thead>
        <tbody>{sorted.slice(0, 15).map((s, i) => (
          <tr key={i} onClick={() => s.playerId != null && nav?.(s.playerId != null ? s.playerId : s.playerName)} style={{ borderBottom: "1px solid #161616", cursor: nav ? "pointer" : "default" }}>
            <td style={{ ...td, textAlign: "left", padding: "4px 10px", fontWeight: "bold", color: "#ddd" }}>{s.playerName}</td>
            {cols.map(([lbl, key]) => <td key={lbl} style={{ ...td, color: "#bbb" }}>{s[key] != null ? s[key] : 0}</td>)}
          </tr>))}</tbody>
      </table>
    </div>
  );
}

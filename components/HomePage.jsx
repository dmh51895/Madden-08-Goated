"use client";
import React, { useMemo, useState } from "react";
import { teamColor, teamAccent } from "../data/teamColors";

const HEADER_STYLE = { fontSize: 11, fontWeight: "bold", color: "#15803d", letterSpacing: 1 };
const ROW_EVEN = "transparent";
const ROW_ODD = "#0a0a0a";
const ROW_HOVER = "#1a1614";
const BORDER = "1px solid #1a1a1a";
const INNER_BORDER = "1px solid #161616";

function StatTable({ title, color, items, statKey, statLabel, onPlayerClick, nameFn, teamFn, posFn }) {
  return (
    <div style={{ background: "#0c0c0c", borderRadius: 6, overflow: "hidden", border: BORDER }}>
      <div style={{ background: `${color}1a`, borderBottom: `1px solid ${color}33`, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, fontWeight: "bold", color, letterSpacing: 1 }}>{title}</div>
        <div style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>{statLabel}</div>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "12px 8px", fontSize: 8, color: "#666", textAlign: "center" }}>No data</div>
      ) : (
        <div>
          {items.map((p, i) => (
            <div
              key={i}
              onClick={() => onPlayerClick?.(p)}
              style={{
                display: "grid", gridTemplateColumns: "18px 1fr 48px", alignItems: "center",
                padding: "5px 10px", borderBottom: i < items.length - 1 ? INNER_BORDER : "none",
                cursor: "pointer", background: i % 2 ? ROW_ODD : ROW_EVEN,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ROW_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 ? ROW_ODD : ROW_EVEN)}
            >
              <span style={{ fontSize: 9, fontWeight: "bold", color: i === 0 ? "#d4a017" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#666" }}>
                {i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: "bold", color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {nameFn(p)}
                </div>
                <div style={{ fontSize: 7, color: "#666" }}>{teamFn(p)} · {posFn(p)}</div>
              </div>
              <span style={{ fontSize: 10, color, fontWeight: "bold", textAlign: "right" }}>
                {(p[statKey] || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage({
  roster = [],
  playerStats = [],
  standings = [],
  gameLogs = [],
  teams = [],
  colleges = {},
  settings = {},
  navigateToTeam,
  navigateToPlayer,
  panel,
  setPanel,
  onNewsImageUpload,
  newsImage,
  onGOTWImageUpload,
  gotwImage,
  year,
  onUpdateSettings,
}) {
  const [newsTitle, setNewsTitle] = useState(settings?.heroTitle || "Welcome to PCFTBALL");
  const [newsSubtitle, setNewsSubtitle] = useState(settings?.heroSubtitle || "Madden at its highest level");
  const [editingHero, setEditingHero] = useState(false);

  const nameOf = (p) => p.playerName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
  const teamOf = (p) => p.team || p.teamAbbr || "";
  const posOf = (p) => p.position || p.positionAbbr || "";
  const idOf = (p) => p.playerId || nameOf(p);

  const leaders = useMemo(() => {
    const hasStats = playerStats?.length > 0;
    const src = hasStats ? playerStats : roster;
    const getPos = (p) => p.position || p.positionAbbr || "";
    const top = (filterFn, sortKey, limit = 5) =>
      [...src]
        .filter(filterFn)
        .filter((p) => hasStats ? (p[sortKey] || 0) > 0 : true)
        .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
        .slice(0, limit);
    if (!hasStats) {
      return {
        passing: top((p) => getPos(p) === "QB", "throwPower"),
        passingRating: top((p) => getPos(p) === "QB", "throwAccuracy"),
        receiving: top((p) => ["WR", "TE"].includes(getPos(p)), "catch"),
        receptions: top((p) => ["WR", "TE", "HB"].includes(getPos(p)), "catch"),
        rushing: top((p) => ["HB", "FB"].includes(getPos(p)), "speed"),
        blocking: top((p) => ["LT", "LG", "C", "RG", "RT"].includes(getPos(p)), "passBlock"),
        tackles: top((p) => ["MLB", "LOLB", "ROLB", "SS", "FS"].includes(getPos(p)), "tackle"),
        sacks: top((p) => ["LE", "RE", "DT", "LOLB", "ROLB"].includes(getPos(p)), "strength"),
      };
    }
    return {
      passing: top((p) => getPos(p) === "QB", "passYards"),
      passingRating: top((p) => getPos(p) === "QB", "passTD"),
      receiving: top((p) => ["WR", "TE", "HB"].includes(getPos(p)), "recYards"),
      receptions: top((p) => ["WR", "TE", "HB"].includes(getPos(p)), "receptions"),
      rushing: top((p) => ["HB", "FB", "QB"].includes(getPos(p)), "rushYards"),
      blocking: top(() => true, "pancakes"),
      tackles: top(() => true, "tackles"),
      sacks: top(() => true, "sacks"),
    };
  }, [playerStats, roster]);

  const haveRealStats = playerStats?.length > 0;

  const gotw = useMemo(() => {
    if (!gameLogs?.length) return null;
    return [...gameLogs].sort((a, b) => (b.week || 0) - (a.week || 0))[0];
  }, [gameLogs]);

  const powerTop = useMemo(() => {
    return [...standings]
      .sort((a, b) => (b.w - a.w) || ((b.diff || 0) - (a.diff || 0)))
      .slice(0, 10);
  }, [standings]);

  const headlines = useMemo(() => {
    const items = [];
    if (gotw) {
      const winner = gotw.homeScore > gotw.awayScore ? gotw.home : gotw.away;
      const loser = gotw.homeScore > gotw.awayScore ? gotw.away : gotw.home;
      const wScore = Math.max(gotw.homeScore, gotw.awayScore);
      const lScore = Math.min(gotw.homeScore, gotw.awayScore);
      items.push({ tag: "RECAP", title: `${winner} take down ${loser}, ${wScore}-${lScore}`, sub: `Week ${gotw.week} · Final` });
    }
    const topTeam = powerTop[0];
    if (topTeam) {
      items.push({
        tag: "POWER",
        title: `${topTeam.city || topTeam.abbr} sit atop the rankings at ${topTeam.w}-${topTeam.l}`,
        sub: `${(topTeam.diff || 0) > 0 ? "+" : ""}${topTeam.diff || 0} point differential`,
      });
    }
    const topRusher = leaders.rushing?.[0];
    if (topRusher) {
      const nm = nameOf(topRusher);
      items.push({
        tag: "STATS",
        title: `${nm} leads the league in rushing`,
        sub: haveRealStats ? `${topRusher.rushYards || 0} yards` : `${teamOf(topRusher)} · ${posOf(topRusher)}`,
      });
    }
    if (items.length < 3) {
      items.push({
        tag: "SEASON",
        title: `${year || "Current"} season is underway`,
        sub: `${roster.length} players, ${teams.length} teams active`,
      });
    }
    return items.slice(0, 4);
  }, [gotw, powerTop, leaders, haveRealStats, year, roster.length, teams.length]);

  return (
    <div>
      {/* ── HERO CARD ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2.2fr)", gap: 12, marginBottom: 16 }}>
        {/* Left: hero image */}
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#0c0c0c", border: BORDER, minHeight: 180 }}>
          {newsImage ? (
            <img src={newsImage} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: 180, background: "linear-gradient(135deg, #1f1a14 0%, #2a1f15 50%, #3d2814 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 48, opacity: 0.6 }}>🏈</div>
            </div>
          )}
          <label style={{
            position: "absolute", top: 8, right: 8, fontSize: 8, padding: "3px 8px",
            borderRadius: 4, background: "rgba(0,0,0,0.7)", border: "1px solid #444",
            color: "#ddd", cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
          }}>
            📷
            <input type="file" accept="image/*" onChange={onNewsImageUpload} style={{ display: "none" }} />
          </label>
        </div>

        {/* Right: welcome card */}
        <div style={{
          background: "linear-gradient(135deg, #1a1510 0%, #221a12 50%, #2d2015 100%)",
          borderRadius: 8, border: BORDER, padding: 20,
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontSize: 10, color: "#d4a017", fontWeight: "bold", letterSpacing: 2, marginBottom: 8 }}>PCFTBALL</div>
          {editingHero ? (
            <>
              <input
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                style={{ width: "100%", fontSize: 20, fontWeight: "bold", color: "#fff", background: "rgba(0,0,0,0.4)", border: "1px solid #444", borderRadius: 4, padding: "4px 8px", fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box" }}
              />
              <input
                value={newsSubtitle}
                onChange={(e) => setNewsSubtitle(e.target.value)}
                style={{ width: "100%", fontSize: 11, color: "#aaa", background: "rgba(0,0,0,0.4)", border: "1px solid #444", borderRadius: 4, padding: "4px 8px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              <button
                onClick={() => setEditingHero(false)}
                style={{ marginTop: 8, fontSize: 8, padding: "4px 10px", borderRadius: 4, border: "1px solid #d4a017", background: "#d4a01733", color: "#d4a017", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}
              >
                SAVE
              </button>
            </>
          ) : (
            <div onClick={() => setEditingHero(true)} style={{ cursor: "text" }}>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
                {newsTitle}
              </div>
              <div style={{ fontSize: 11, color: "#999" }}>{newsSubtitle}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN GRID ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16 }}>

        {/* ═══════════ LEFT COLUMN ═══════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stat Leaders — 4 columns */}
          <div>
            <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={HEADER_STYLE}>🏆 PCFT STAT LEADERS</span>
              {!haveRealStats && (
                <span style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>· attribute-based (upload Player Stats CSV for real numbers)</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              <StatTable title="PASSING YARDS" color="#15803d" items={leaders.passing} statKey={haveRealStats ? "passYards" : "throwPower"} statLabel={haveRealStats ? "YDS" : "THP"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="PASSING TDs" color="#15803d" items={leaders.passingRating} statKey={haveRealStats ? "passTD" : "throwAccuracy"} statLabel={haveRealStats ? "TD" : "THA"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="RECEIVING YDS" color="#3b6db5" items={leaders.receiving} statKey={haveRealStats ? "recYards" : "catch"} statLabel={haveRealStats ? "YDS" : "CTH"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="RECEPTIONS" color="#3b6db5" items={leaders.receptions} statKey={haveRealStats ? "receptions" : "catch"} statLabel="REC" onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="RUSHING YARDS" color="#c41e1e" items={leaders.rushing} statKey={haveRealStats ? "rushYards" : "speed"} statLabel={haveRealStats ? "YDS" : "SPD"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="BLOCKING" color="#a8651e" items={leaders.blocking} statKey={haveRealStats ? "pancakes" : "passBlock"} statLabel={haveRealStats ? "PNCK" : "PBK"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="TACKLES" color="#dc2626" items={leaders.tackles} statKey={haveRealStats ? "tackles" : "tackle"} statLabel="TKL" onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="SACKS" color="#dc2626" items={leaders.sacks} statKey={haveRealStats ? "sacks" : "strength"} statLabel={haveRealStats ? "SACK" : "STR"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
            </div>
          </div>

          {/* Defensive Leaders — 3 columns */}
          <div>
            <div style={{ marginBottom: 8 }}>
              <span style={HEADER_STYLE}>🛡️ DEFENSIVE LEADERS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <StatTable title="TACKLES" color="#dc2626" items={leaders.tackles} statKey={haveRealStats ? "tackles" : "tackle"} statLabel="TKL" onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="SACKS" color="#dc2626" items={leaders.sacks} statKey={haveRealStats ? "sacks" : "strength"} statLabel={haveRealStats ? "SACK" : "STR"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
              <StatTable title="INTERCEPTIONS" color="#3b6db5" items={leaders.passingRating} statKey={haveRealStats ? "passTD" : "throwAccuracy"} statLabel={haveRealStats ? "INT" : "THA"} onPlayerClick={(p) => navigateToPlayer?.(idOf(p))} nameFn={nameOf} teamFn={teamOf} posFn={posOf} />
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT COLUMN ═══════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* GOTW */}
          <div style={{ background: "#0c0c0c", borderRadius: 8, border: BORDER, overflow: "hidden" }}>
            <div style={{ background: "#3b6db522", borderBottom: "1px solid #3b6db533", padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 9, fontWeight: "bold", color: "#3b6db5", letterSpacing: 1 }}>🎮 GOTW</div>
              <label style={{ fontSize: 7, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.5)", border: "1px solid #333", color: "#aaa", cursor: "pointer", fontFamily: "inherit" }}>
                📷
                <input type="file" accept="image/*" onChange={onGOTWImageUpload} style={{ display: "none" }} />
              </label>
            </div>
            {gotwImage && (
              <img src={gotwImage} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
            )}
            {gotw ? (
              <div style={{ padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6 }}>
                  {[
                    { side: "away", abbr: gotw.away, score: gotw.awayScore, winner: gotw.awayScore > gotw.homeScore },
                    null,
                    { side: "home", abbr: gotw.home, score: gotw.homeScore, winner: gotw.homeScore > gotw.awayScore },
                  ].map((t, i) => {
                    if (!t) return <div key="vs" style={{ fontSize: 7, color: "#444", letterSpacing: 1 }}>FINAL</div>;
                    return (
                      <div key={t.side} onClick={() => navigateToTeam?.(t.abbr)} style={{ textAlign: "center", cursor: "pointer" }}>
                        <img src={`/logos/${t.abbr}.png`} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <div style={{ fontSize: 9, fontWeight: "bold", color: t.winner ? "#22c55e" : "#888" }}>{t.abbr}</div>
                        <div style={{ fontSize: 16, fontWeight: "bold", color: t.winner ? "#fff" : "#666" }}>{t.score}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 7, color: "#555", textAlign: "center", marginTop: 6 }}>WEEK {gotw.week}</div>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "#555", fontSize: 8 }}>
                No games yet — upload a game log in Schedules
              </div>
            )}
          </div>

          {/* Playoff Bracket */}
          <PlayoffBracket standings={standings} teams={teams} navigateToTeam={navigateToTeam} year={year} settings={settings} onUpdateSettings={onUpdateSettings} />

          {/* Headlines */}
          <div style={{ background: "#0c0c0c", borderRadius: 8, border: BORDER, overflow: "hidden" }}>
            <div style={{ background: "#c41e1e22", borderBottom: "1px solid #c41e1e33", padding: "8px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: "bold", color: "#c41e1e", letterSpacing: 1 }}>📰 TOP HEADLINES</div>
            </div>
            <div>
              {headlines.map((h, i) => (
                <div key={i} style={{ padding: "10px 12px", borderBottom: i < headlines.length - 1 ? INNER_BORDER : "none" }}>
                  <div style={{ fontSize: 7, color: "#c41e1e", letterSpacing: 2, fontWeight: "bold", marginBottom: 3 }}>
                    {h.tag}
                  </div>
                  <div style={{ fontSize: 10, color: "#e0e0e0", fontWeight: "bold", lineHeight: 1.3, marginBottom: 3 }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: 8, color: "#777" }}>{h.sub}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPanel?.("schedules")}
              style={{ background: "#0a0a0a", border: "none", borderTop: INNER_BORDER, padding: "8px 12px", fontSize: 8, color: "#888", cursor: "pointer", textAlign: "center", fontFamily: "inherit", letterSpacing: 1, width: "100%" }}
            >
              VIEW FULL SCHEDULE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PLAYOFF BRACKET — tabbed rounds
   ═══════════════════════════════════════════════════════ */
function PlayoffBracket({ standings, teams, navigateToTeam, year, settings, onUpdateSettings }) {
  const ROUNDS = ["wildCard", "divisional", "conference", "superBowl"];
  const ROUND_LABELS = { wildCard: "WILD CARD", divisional: "DIVISIONAL", conference: "CONFERENCE", superBowl: "SUPER BOWL" };
  const [activeRound, setActiveRound] = React.useState("wildCard");

  const sorted = [...standings].sort((a, b) => (b.w - a.w) || ((b.diff || 0) - (a.diff || 0)));
  const seedList = sorted.map((t, i) => ({ ...t, seed: i + 1 }));

  let numTeams;
  if (seedList.length <= 8) numTeams = 8;
  else if (seedList.length <= 10) numTeams = 10;
  else if (seedList.length <= 11) numTeams = 11;
  else numTeams = 12;

  const bracketSeeds = seedList.slice(0, numTeams);
  const playoffGames = settings?.playoffGames || {};

  function getTeamByAbbr(abbr) {
    return teams?.find((t) => (t.abbr || "").toUpperCase() === abbr.toUpperCase()) || null;
  }

  function getRecord(abbr) {
    const s = standings?.find((x) => x.abbr === abbr);
    return s ? `${s.w}-${s.l}` : "";
  }

  // Auto-generate Wild Card matchups from seeds
  function getWildCardMatchups() {
    let byes, wcRounds;
    if (numTeams === 8) {
      byes = 0;
      wcRounds = [[bracketSeeds[0], bracketSeeds[7]], [bracketSeeds[3], bracketSeeds[4]], [bracketSeeds[1], bracketSeeds[6]], [bracketSeeds[2], bracketSeeds[5]]];
    } else if (numTeams === 10) {
      byes = 2;
      wcRounds = [[bracketSeeds[2], bracketSeeds[9]], [bracketSeeds[3], bracketSeeds[8]], [bracketSeeds[4], bracketSeeds[7]], [bracketSeeds[5], bracketSeeds[6]]];
    } else if (numTeams === 11) {
      byes = 3;
      wcRounds = [[bracketSeeds[3], bracketSeeds[10]], [bracketSeeds[4], bracketSeeds[9]], [bracketSeeds[5], bracketSeeds[8]]];
    } else {
      byes = 4;
      wcRounds = [[bracketSeeds[4], bracketSeeds[11]], [bracketSeeds[5], bracketSeeds[10]], [bracketSeeds[6], bracketSeeds[9]], [bracketSeeds[7], bracketSeeds[8]]];
    }
    return { byes, matchups: wcRounds.map(([h, a]) => ({ home: h?.abbr || "", away: a?.abbr || "", homeScore: null, awayScore: null })) };
  }

  function getRoundGames(round) {
    if (round === "wildCard") return getWildCardMatchups().matchups;
    return playoffGames[round] || [];
  }

  function updateGame(round, idx, field, value) {
    const current = getRoundGames(round);
    const updated = [...current];
    updated[idx] = { ...updated[idx], [field]: value };
    onUpdateSettings?.({ playoffGames: { ...playoffGames, [round]: updated } });
  }

  function addGame(round) {
    const current = getRoundGames(round);
    onUpdateSettings?.({ playoffGames: { ...playoffGames, [round]: [...current, { home: "", away: "", homeScore: null, awayScore: null }] } });
  }

  function removeGame(round, idx) {
    const current = getRoundGames(round);
    onUpdateSettings?.({ playoffGames: { ...playoffGames, [round]: current.filter((_, i) => i !== idx) } });
  }

  const currentMatchups = getRoundGames(activeRound);
  const { byes } = getWildCardMatchups();

  return (
    <div style={{ background: "#0c0c0c", borderRadius: 8, border: BORDER, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#15803d22", borderBottom: "1px solid #15803d33", padding: "8px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#15803d", letterSpacing: 1 }}>
          🏈 {year || ""} PLAYOFF BRACKET ({numTeams} TEAMS)
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a" }}>
        {ROUNDS.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            style={{
              flex: 1, padding: "7px 4px", fontSize: 8, fontWeight: "bold", letterSpacing: 1,
              border: "none", borderBottom: activeRound === r ? "2px solid #15803d" : "2px solid transparent",
              background: activeRound === r ? "#15803d15" : "transparent",
              color: activeRound === r ? "#15803d" : "#666",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
            }}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Round Content */}
      <div style={{ padding: 10 }}>
        {activeRound === "wildCard" && byes > 0 && (
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1, marginBottom: 8 }}>
            {byes} TEAM{byes > 1 ? "S" : ""} WITH BYE: {bracketSeeds.slice(0, byes).map((t) => t.abbr).join(", ")}
          </div>
        )}

        {currentMatchups.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", marginBottom: 8 }}>
              {activeRound === "wildCard" ? "No standings data" : `No ${ROUND_LABELS[activeRound].toLowerCase()} games entered`}
            </div>
            {activeRound !== "wildCard" && (
              <button
                onClick={() => addGame(activeRound)}
                style={{ fontSize: 8, padding: "4px 10px", borderRadius: 4, border: "1px solid #15803d", background: "#15803d22", color: "#15803d", cursor: "pointer", fontFamily: "inherit" }}
              >
                + ADD GAME
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {currentMatchups.map((game, idx) => (
              <BracketMatchup
                key={idx}
                game={game}
                round={activeRound}
                idx={idx}
                editable={activeRound !== "wildCard"}
                navigateToTeam={navigateToTeam}
                getTeamByAbbr={getTeamByAbbr}
                getRecord={getRecord}
                onUpdate={(field, val) => updateGame(activeRound, idx, field, val)}
                onRemove={() => removeGame(activeRound, idx)}
              />
            ))}
            {activeRound !== "wildCard" && (
              <button
                onClick={() => addGame(activeRound)}
                style={{ fontSize: 8, padding: "4px 10px", borderRadius: 4, border: "1px dashed #333", background: "transparent", color: "#666", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}
              >
                + ADD GAME
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BracketMatchup({ game, round, idx, editable, navigateToTeam, getTeamByAbbr, getRecord, onUpdate, onRemove }) {
  const [editing, setEditing] = React.useState(false);
  const [localHome, setLocalHome] = React.useState(game.home || "");
  const [localAway, setLocalAway] = React.useState(game.away || "");
  const [localHomeScore, setLocalHomeScore] = React.useState(game.homeScore ?? "");
  const [localAwayScore, setLocalAwayScore] = React.useState(game.awayScore ?? "");

  const homeWon = game.homeScore != null && game.awayScore != null && game.homeScore > game.awayScore;
  const awayWon = game.homeScore != null && game.awayScore != null && game.awayScore > game.homeScore;
  const decided = homeWon || awayWon;

  const save = () => {
    onUpdate("home", localHome.toUpperCase());
    onUpdate("away", localAway.toUpperCase());
    onUpdate("homeScore", localHomeScore === "" ? null : parseInt(localHomeScore));
    onUpdate("awayScore", localAwayScore === "" ? null : parseInt(localAwayScore));
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ background: "#0a0a0a", borderRadius: 6, border: "1px solid #15803d44", padding: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 1fr auto", gap: 6, alignItems: "center" }}>
          <input value={localHome} onChange={(e) => setLocalHome(e.target.value)} placeholder="HOME"
            style={{ fontSize: 9, padding: "3px 6px", borderRadius: 3, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", textTransform: "uppercase" }} />
          <input type="number" value={localHomeScore} onChange={(e) => setLocalHomeScore(e.target.value)} placeholder="0"
            style={{ fontSize: 9, padding: "3px 4px", borderRadius: 3, border: "1px solid #333", background: "#111", color: "#fff", fontFamily: "inherit", textAlign: "center" }} />
          <input type="number" value={localAwayScore} onChange={(e) => setLocalAwayScore(e.target.value)} placeholder="0"
            style={{ fontSize: 9, padding: "3px 4px", borderRadius: 3, border: "1px solid #333", background: "#111", color: "#fff", fontFamily: "inherit", textAlign: "center" }} />
          <input value={localAway} onChange={(e) => setLocalAway(e.target.value)} placeholder="AWAY"
            style={{ fontSize: 9, padding: "3px 6px", borderRadius: 3, border: "1px solid #333", background: "#111", color: "#00d8a8", fontFamily: "inherit", textTransform: "uppercase" }} />
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={save} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 3, border: "1px solid #15803d", background: "#15803d33", color: "#15803d", cursor: "pointer", fontFamily: "inherit" }}>✓</button>
            <button onClick={onRemove} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 3, border: "1px solid #dc2626", background: "#dc262622", color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0a0a0a", borderRadius: 6, border: "1px solid #1a1a1a", padding: "6px 8px",
        cursor: editable ? "pointer" : "default",
      }}
      onClick={() => editable && setEditing(true)}
    >
      <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 32px 12px 32px 1fr 24px", alignItems: "center", gap: 4 }}>
        <img src={`/logos/${game.home}.png`} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
        <div onClick={(e) => { e.stopPropagation(); navigateToTeam?.(game.home); }} style={{ cursor: "pointer" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: decided && homeWon ? "#22c55e" : "#e0e0e0" }}>{game.home || "TBD"}</div>
          <div style={{ fontSize: 7, color: "#555" }}>{getRecord(game.home)}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: "bold", color: decided && homeWon ? "#22c55e" : "#888", textAlign: "center" }}>
          {game.homeScore != null ? game.homeScore : "-"}
        </div>
        <div style={{ fontSize: 8, color: "#333", textAlign: "center" }}>@</div>
        <div style={{ fontSize: 14, fontWeight: "bold", color: decided && awayWon ? "#22c55e" : "#888", textAlign: "center" }}>
          {game.awayScore != null ? game.awayScore : "-"}
        </div>
        <div onClick={(e) => { e.stopPropagation(); navigateToTeam?.(game.away); }} style={{ cursor: "pointer", textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: decided && awayWon ? "#22c55e" : "#e0e0e0" }}>{game.away || "TBD"}</div>
          <div style={{ fontSize: 7, color: "#555" }}>{getRecord(game.away)}</div>
        </div>
        <img src={`/logos/${game.away}.png`} alt="" style={{ width: 20, height: 20, objectFit: "contain", justifySelf: "end" }} onError={(e) => { e.target.style.display = "none"; }} />
      </div>
      {editable && (
        <div style={{ fontSize: 7, color: "#333", textAlign: "center", marginTop: 4, letterSpacing: 1 }}>CLICK TO EDIT</div>
      )}
    </div>
  );
}

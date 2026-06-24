"use client";
import React, { useMemo, useState } from "react";
import { teamColor, teamAccent } from "../data/teamColors";

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
}) {
  const [newsTitle, setNewsTitle] = useState(settings?.heroTitle || "Welcome to PCFTBALL");
  const [newsSubtitle, setNewsSubtitle] = useState(settings?.heroSubtitle || "Madden at its highest level");
  const [editingHero, setEditingHero] = useState(false);

  // ── Stat leaders (8 categories like the legacy site) ──────
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
      const nm = topRusher.playerName || `${topRusher.firstName || ""} ${topRusher.lastName || ""}`.trim();
      items.push({
        tag: "STATS",
        title: `${nm} leads the league in rushing`,
        sub: haveRealStats ? `${topRusher.rushYards || 0} yards` : `${topRusher.teamAbbr || topRusher.team} · ${topRusher.positionAbbr || topRusher.position}`,
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

  const nameOf = (p) => p.playerName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
  const teamOf = (p) => p.team || p.teamAbbr || "";
  const posOf = (p) => p.position || p.positionAbbr || "";
  const idOf = (p) => p.playerId || nameOf(p);

  const LeaderCard = ({ title, color, items, statKey, statLabel }) => (
    <div style={{ background: "#0c0c0c", borderRadius: 6, overflow: "hidden", border: "1px solid #1a1a1a" }}>
      <div style={{ background: `${color}1a`, borderBottom: `1px solid ${color}33`, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, fontWeight: "bold", color, letterSpacing: 1 }}>{title}</div>
        <div style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>{statLabel}</div>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "12px 8px", fontSize: 8, color: "#666", textAlign: "center" }}>No data</div>
      ) : items.map((p, i) => (
        <div
          key={i}
          onClick={() => navigateToPlayer?.(idOf(p))}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
            borderBottom: i < items.length - 1 ? "1px solid #161616" : "none",
            cursor: "pointer", background: i % 2 ? "#0a0a0a" : "transparent",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
          onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 ? "#0a0a0a" : "transparent")}
        >
          <span style={{ fontSize: 9, fontWeight: "bold", color: i === 0 ? "#d4a017" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#666", minWidth: 12 }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: "bold", color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nameOf(p)}
            </div>
            <div style={{ fontSize: 7, color: "#666" }}>{teamOf(p)} · {posOf(p)}</div>
          </div>
          <span style={{ fontSize: 10, color, fontWeight: "bold" }}>
            {(p[statKey] || 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* HERO ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{
          position: "relative", borderRadius: 8, overflow: "hidden",
          background: "#0c0c0c", border: "1px solid #1a1a1a", minHeight: 216,
        }}>
          {newsImage ? (
            <img src={newsImage} alt="" style={{ width: "100%", height: 216, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{
              width: "100%", height: 216,
              background: "linear-gradient(135deg, #1f1a14 0%, #2a1f15 50%, #3d2814 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🏈</div>
                <div style={{ fontSize: 11, color: "#888" }}>Click 📷 to set a hero image</div>
              </div>
            </div>
          )}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.95) 100%)",
            padding: "80px 20px 20px",
          }}>
            <div style={{ fontSize: 8, color: "#c41e1e", fontWeight: "bold", letterSpacing: 2, marginBottom: 6 }}>
              FEATURED
            </div>
            {editingHero ? (
              <>
                <input
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  style={{ width: "100%", fontSize: 22, fontWeight: "bold", color: "#fff", background: "rgba(0,0,0,0.4)", border: "1px solid #444", borderRadius: 4, padding: "4px 8px", fontFamily: "inherit", marginBottom: 4, boxSizing: "border-box" }}
                />
                <input
                  value={newsSubtitle}
                  onChange={(e) => setNewsSubtitle(e.target.value)}
                  style={{ width: "100%", fontSize: 11, color: "#aaa", background: "rgba(0,0,0,0.4)", border: "1px solid #444", borderRadius: 4, padding: "4px 8px", fontFamily: "inherit", boxSizing: "border-box" }}
                />
                <button
                  onClick={() => setEditingHero(false)}
                  style={{ marginTop: 6, fontSize: 8, padding: "4px 10px", borderRadius: 4, border: "1px solid #c41e1e", background: "#c41e1e33", color: "#c41e1e", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Save
                </button>
              </>
            ) : (
              <div onClick={() => setEditingHero(true)} style={{ cursor: "text" }}>
                <div style={{ fontSize: 24, fontWeight: "bold", color: "#fff", lineHeight: 1.15, marginBottom: 6 }}>
                  {newsTitle}
                </div>
                <div style={{ fontSize: 11, color: "#bbb" }}>{newsSubtitle}</div>
              </div>
            )}
          </div>
          <label style={{
            position: "absolute", top: 10, right: 10, fontSize: 8, padding: "4px 10px",
            borderRadius: 4, background: "rgba(0,0,0,0.7)", border: "1px solid #444",
            color: "#ddd", cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
          }}>
            📷 CHANGE
            <input type="file" accept="image/*" onChange={onNewsImageUpload} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#c41e1e22", borderBottom: "1px solid #c41e1e33", padding: "8px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#c41e1e", letterSpacing: 1 }}>TOP HEADLINES</div>
          </div>
          <div style={{ flex: 1 }}>
            {headlines.map((h, i) => (
              <div key={i} style={{ padding: "10px 12px", borderBottom: i < headlines.length - 1 ? "1px solid #161616" : "none" }}>
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
            style={{ background: "#0a0a0a", border: "none", borderTop: "1px solid #1a1a1a", padding: "8px 12px", fontSize: 8, color: "#888", cursor: "pointer", textAlign: "center", fontFamily: "inherit", letterSpacing: 1 }}
          >
            VIEW FULL SCHEDULE →
          </button>
        </div>
      </div>

      {/* GOTW + PLAYOFF BRACKET */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: 12, marginBottom: 16 }}>
        {/* Compact GOTW */}
        <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden" }}>
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
              No games yet
            </div>
          )}
        </div>

        {/* Playoff Bracket */}
        <PlayoffBracket standings={standings} teams={teams} navigateToTeam={navigateToTeam} year={year} />
      </div>

      {/* STAT LEADERS GRID */}
      <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#d4a017", letterSpacing: 1 }}>🏆 PCFT STAT LEADERS</span>
        {!haveRealStats && (
          <span style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>· attribute-based (upload Player Stats CSV for real numbers)</span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
        <LeaderCard title="PASSING LEADER"   color="#15803d" items={leaders.passing}        statKey={haveRealStats ? "passYards"  : "throwPower"}    statLabel={haveRealStats ? "YDS" : "THP"} />
        <LeaderCard title="PASSING TDs"      color="#15803d" items={leaders.passingRating} statKey={haveRealStats ? "passTD"     : "throwAccuracy"} statLabel={haveRealStats ? "TD"  : "THA"} />
        <LeaderCard title="RECEIVING LEADER" color="#3b6db5" items={leaders.receiving}     statKey={haveRealStats ? "recYards"   : "catch"}        statLabel={haveRealStats ? "YDS" : "CTH"} />
        <LeaderCard title="RECEPTIONS"       color="#3b6db5" items={leaders.receptions}    statKey={haveRealStats ? "receptions" : "catch"}        statLabel="REC" />
        <LeaderCard title="RUSHING LEADER"   color="#c41e1e" items={leaders.rushing}       statKey={haveRealStats ? "rushYards"  : "speed"}        statLabel={haveRealStats ? "YDS" : "SPD"} />
        <LeaderCard title="BLOCKING LEADER"  color="#a8651e" items={leaders.blocking}      statKey={haveRealStats ? "pancakes"   : "passBlock"}    statLabel={haveRealStats ? "PNCK" : "PBK"} />
        <LeaderCard title="DEFENSIVE TACKLES" color="#dc2626" items={leaders.tackles}      statKey={haveRealStats ? "tackles"    : "tackle"}       statLabel="TKL" />
        <LeaderCard title="SACKS LEADER"     color="#dc2626" items={leaders.sacks}         statKey={haveRealStats ? "sacks"      : "strength"}     statLabel={haveRealStats ? "SACK" : "STR"} />
      </div>

    </div>
  );
}

function PlayoffBracket({ standings, teams, navigateToTeam, year }) {
  if (!standings.length || !teams?.length) return null;

  const sorted = [...standings]
    .sort((a, b) => (b.w - a.w) || ((b.diff || 0) - (a.diff || 0)));

  const seedList = sorted.map((t, i) => ({ ...t, seed: i + 1 }));

  let numTeams;
  if (seedList.length <= 8) numTeams = 8;
  else if (seedList.length <= 10) numTeams = 10;
  else if (seedList.length <= 11) numTeams = 11;
  else numTeams = 12;

  const bracketSeeds = seedList.slice(0, numTeams);

  function getTeamByAbbr(abbr) {
    return teams?.find((t) => (t.abbr || "").toUpperCase() === abbr.toUpperCase()) || null;
  }

  function getRecord(abbr) {
    const s = standings?.find((x) => x.abbr === abbr);
    return s ? `${s.w}-${s.l}` : "";
  }

  let wcRounds, byes;
  if (numTeams === 8) {
    byes = 0;
    wcRounds = [
      [bracketSeeds[0], bracketSeeds[7]],
      [bracketSeeds[3], bracketSeeds[4]],
      [bracketSeeds[1], bracketSeeds[6]],
      [bracketSeeds[2], bracketSeeds[5]],
    ];
  } else if (numTeams === 10) {
    byes = 2;
    wcRounds = [
      [bracketSeeds[2], bracketSeeds[9]],
      [bracketSeeds[3], bracketSeeds[8]],
      [bracketSeeds[4], bracketSeeds[7]],
      [bracketSeeds[5], bracketSeeds[6]],
    ];
  } else if (numTeams === 11) {
    byes = 3;
    wcRounds = [
      [bracketSeeds[3], bracketSeeds[10]],
      [bracketSeeds[4], bracketSeeds[9]],
      [bracketSeeds[5], bracketSeeds[8]],
    ];
  } else {
    byes = 4;
    wcRounds = [
      [bracketSeeds[4], bracketSeeds[11]],
      [bracketSeeds[5], bracketSeeds[10]],
      [bracketSeeds[6], bracketSeeds[9]],
      [bracketSeeds[7], bracketSeeds[8]],
    ];
  }

  function MatchupSlot({ match, roundIdx }) {
    if (!match) return null;
    const [home, away] = match;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 110 }}>
        <BracketTeam seed={home.seed} abbr={home.abbr} record={getRecord(home.abbr)} teamData={getTeamByAbbr(home.abbr)} navigateToTeam={navigateToTeam} />
        <BracketTeam seed={away.seed} abbr={away.abbr} record={getRecord(away.abbr)} teamData={getTeamByAbbr(away.abbr)} navigateToTeam={navigateToTeam} />
      </div>
    );
  }

  return (
    <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden" }}>
      <div style={{ background: "#15803d22", borderBottom: "1px solid #15803d33", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#15803d", letterSpacing: 1 }}>
          🏈 {year || ""} PLAYOFF BRACKET ({numTeams} TEAMS)
        </div>
        <button
          onClick={() => { }}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, border: "1px solid #15803d", background: "transparent", color: "#15803d", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, opacity: 0.6 }}
        >
          FULL BRACKET →
        </button>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {byes > 0 && (
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>
            {byes} TEAM{byes > 1 ? "S" : ""} WITH BYE: {bracketSeeds.slice(0, byes).map((t) => t.abbr).join(", ")}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {wcRounds.map((match, i) => (
            <div key={i} style={{ background: "#0a0a0a", borderRadius: 6, border: "1px solid #1a1a1a", padding: 8 }}>
              <div style={{ fontSize: 7, color: "#444", letterSpacing: 1, marginBottom: 6 }}>
                {numTeams === 8 ? "WILD CARD" : numTeams === 10 ? "WILD CARD" : numTeams === 11 ? "WILD CARD" : "WILD CARD"}
              </div>
              <MatchupSlot match={match} roundIdx={0} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 8, color: "#666", textAlign: "center", letterSpacing: 1, marginTop: 4 }}>
          ↑ WILD CARD → DIVISIONAL → SUPER BOWL ↑
        </div>
      </div>
    </div>
  );
}

function BracketTeam({ seed, abbr, record, teamData, navigateToTeam }) {
  const colors = [
    { bg: "#d4a017", fg: "#000" },
    { bg: "#c0c0c0", fg: "#000" },
    { bg: "#cd7f32", fg: "#000" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
    { bg: "#15803d", fg: "#fff" },
  ];
  const seedColor = colors[Math.min(seed - 1, colors.length - 1)];
  const teamColors = teamData?.primary ? { bg: `#${teamData.primary}`, fg: "#fff" } : seedColor;

  return (
    <div
      onClick={() => abbr && navigateToTeam?.(abbr)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 6px", borderRadius: 4,
        background: teamColors.bg,
        color: teamColors.fg,
        cursor: abbr ? "pointer" : "default",
        fontSize: 9,
        opacity: abbr ? 1 : 0.4,
      }}
    >
      <span style={{ fontSize: 8, fontWeight: "bold", opacity: 0.7 }}>#{seed}</span>
      <span style={{ fontWeight: "bold" }}>{abbr}</span>
      <span style={{ fontSize: 8, marginLeft: "auto", opacity: 0.8 }}>{record}</span>
    </div>
  );
}


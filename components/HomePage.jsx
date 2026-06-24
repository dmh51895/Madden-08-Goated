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
          background: "#0c0c0c", border: "1px solid #1a1a1a", minHeight: 360,
        }}>
          {newsImage ? (
            <img src={newsImage} alt="" style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{
              width: "100%", height: 360,
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

      {/* GOTW + POWER RANKINGS */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden" }}>
          <div style={{ background: "#3b6db522", borderBottom: "1px solid #3b6db533", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#3b6db5", letterSpacing: 1 }}>🎮 GAME OF THE WEEK</div>
            <label style={{ fontSize: 7, padding: "3px 8px", borderRadius: 4, background: "rgba(0,0,0,0.5)", border: "1px solid #333", color: "#aaa", cursor: "pointer", fontFamily: "inherit" }}>
              📷
              <input type="file" accept="image/*" onChange={onGOTWImageUpload} style={{ display: "none" }} />
            </label>
          </div>
          {gotwImage && (
            <img src={gotwImage} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
          )}
          {gotw ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "stretch", gap: 12 }}>
                {[
                  { side: "away", abbr: gotw.away, score: gotw.awayScore, label: "AWAY", winner: gotw.awayScore > gotw.homeScore },
                  null,
                  { side: "home", abbr: gotw.home, score: gotw.homeScore, label: "HOME", winner: gotw.homeScore > gotw.awayScore },
                ].map((t, i) => {
                  if (!t) return (
                    <div key="vs" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444", letterSpacing: 2 }}>FINAL</div>
                  );
                  const c = teamColor(t.abbr);
                  return (
                    <div
                      key={t.side}
                      onClick={() => navigateToTeam?.(t.abbr)}
                      style={{
                        background: c.bg, color: c.fg,
                        borderRadius: 6, padding: "12px 8px", textAlign: "center", cursor: "pointer",
                        border: t.winner ? "2px solid #22c55e" : "2px solid transparent",
                        boxShadow: t.winner ? "0 0 12px rgba(34,197,94,0.25)" : "none",
                      }}
                    >
                      <div style={{ fontSize: 7, opacity: 0.7, letterSpacing: 2, marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 20, fontWeight: "bold" }}>{t.abbr}</div>
                      <div style={{ fontSize: 32, fontWeight: "bold", marginTop: 4 }}>{t.score}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 8, color: "#666", textAlign: "center", marginTop: 10, letterSpacing: 1 }}>
                WEEK {gotw.week}
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#666", fontSize: 10 }}>
              No games played yet — upload a game log in Schedules
            </div>
          )}
        </div>

        <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden" }}>
          <div style={{ background: "#d4a01722", borderBottom: "1px solid #d4a01733", padding: "8px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", letterSpacing: 1 }}>⚡ POWER RANKINGS</div>
          </div>
          {powerTop.length === 0 ? (
            <div style={{ padding: 30, fontSize: 10, color: "#666", textAlign: "center" }}>No standings data yet</div>
          ) : powerTop.slice(0, 8).map((t, i) => {
            const c = teamColor(t.abbr);
            return (
            <div
              key={t.abbr}
              onClick={() => navigateToTeam?.(t.abbr)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 10px",
                borderBottom: i < Math.min(powerTop.length - 1, 7) ? "1px solid #161616" : "none",
                cursor: "pointer", background: i % 2 ? "#0a0a0a" : "transparent",
                borderLeft: `3px solid ${c.bg}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 ? "#0a0a0a" : "transparent")}
            >
              <span style={{ fontSize: 10, fontWeight: "bold", color: i === 0 ? "#d4a017" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#666", minWidth: 16 }}>
                #{i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: "bold", color: teamAccent(t.abbr) }}>{t.abbr}</div>
                <div style={{ fontSize: 7, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.city}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#15803d", fontWeight: "bold" }}>
                  {t.w}-{t.l}{t.t ? `-${t.t}` : ""}
                </div>
                <div style={{ fontSize: 7, color: (t.diff || 0) > 0 ? "#22c55e" : (t.diff || 0) < 0 ? "#dc2626" : "#666" }}>
                  {(t.diff || 0) > 0 ? "+" : ""}{t.diff || 0}
                </div>
              </div>
            </div>
            );
          })}
        </div>
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

      {/* STANDINGS STRIP */}
      <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a", overflow: "hidden" }}>
        <div style={{ background: "#15803d22", borderBottom: "1px solid #15803d33", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#15803d", letterSpacing: 1 }}>📊 {year || ""} STANDINGS</div>
          <button
            onClick={() => setPanel?.("standings")}
            style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, border: "1px solid #15803d", background: "transparent", color: "#15803d", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}
          >
            FULL STANDINGS →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 0 }}>
          {[...standings]
            .sort((a, b) => (b.w - a.w) || ((b.diff || 0) - (a.diff || 0)))
            .slice(0, 12)
            .map((t, i) => {
              const c = teamColor(t.abbr);
              return (
              <div
                key={t.abbr}
                onClick={() => navigateToTeam?.(t.abbr)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px 6px 8px", borderRight: "1px solid #161616", borderBottom: "1px solid #161616", borderLeft: `3px solid ${c.bg}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 9, fontWeight: "bold", color: teamAccent(t.abbr) }}>
                  <span style={{ color: "#666", marginRight: 6, fontWeight: "normal" }}>#{i + 1}</span>
                  {t.abbr}
                </span>
                <span style={{ fontSize: 9, color: "#15803d", fontWeight: "bold" }}>
                  {t.w}-{t.l}{t.t ? `-${t.t}` : ""}
                </span>
              </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

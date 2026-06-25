"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { teamColor, teamAccent } from "../data/teamColors";
import { getPortraitURL, setPortrait, clearPortrait, setBulkPortraits, listPortraitIds } from "../data/portraits";

export default function PlayerPage({
  roster = [],
  selectedPlayer,
  navigateToTeam,
  navigateToPlayer,
  colleges,
  playerStats = [],
}) {
  // ── Player resolution ─────────────────────────────────────
  // Tolerant lookup: selectedPlayer may be a playerId (string/number) OR a
  // full name string (e.g. clicked from a leaderboard row that has no id).
  const player = useMemo(() => {
    if (!roster.length) return null;
    if (selectedPlayer == null || selectedPlayer === "") return null;

    const idStr = String(selectedPlayer);
    const byId = roster.find((p) => String(p.playerId) === idStr);
    if (byId) return byId;

    if (typeof selectedPlayer === "string") {
      const norm = selectedPlayer.trim().toLowerCase();
      const byName = roster.find((p) => {
        const full = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase();
        const rev = `${p.lastName || ""}, ${p.firstName || ""}`.toLowerCase();
        return full === norm || rev === norm;
      });
      if (byName) return byName;
    }
    return null;
  }, [roster, selectedPlayer]);

  // ── Search picker (always available) ──────────────────────
  const [query, setQuery] = useState("");
  const [letterFilter, setLetterFilter] = useState(null);    // matches player1.php's A-Z bar
  const [positionFilter, setPositionFilter] = useState(null); // matches player1.php's position bar

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !letterFilter && !positionFilter) return [];
    return roster
      .filter((p) => {
        if (letterFilter) {
          const last = (p.lastName || "").trim();
          if (!last || last[0].toUpperCase() !== letterFilter) return false;
        }
        if (positionFilter && p.positionAbbr !== positionFilter) return false;
        if (q) {
          const full = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
          if (!full.includes(q) && !(p.teamAbbr || "").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.overall || 0) - (a.overall || 0))
      .slice(0, 50);
  }, [roster, query, letterFilter, positionFilter]);

  const pickPlayer = (id) => {
    setQuery("");
    setLetterFilter(null);
    setPositionFilter(null);
    if (typeof navigateToPlayer === "function") navigateToPlayer(id);
  };

  // ── Hooks below this line must always run in the same order. ─────
  // ── No early returns above them — gate logic on `player` being   ─
  // ── non-null inside each hook instead.                            ─

  // Sorted roster by player ID, for Prev/Next navigation.
  const sortedIds = useMemo(() => {
    return [...roster]
      .map((p) => String(p.playerId))
      .sort((a, b) => {
        const na = Number(a), nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.localeCompare(b);
      });
  }, [roster]);

  const currentIdx = player ? sortedIds.indexOf(String(player.playerId)) : -1;
  const prevId = currentIdx > 0 ? sortedIds[currentIdx - 1] : null;
  const nextId = currentIdx >= 0 && currentIdx < sortedIds.length - 1 ? sortedIds[currentIdx + 1] : null;

  // Portrait load (IndexedDB-backed, blob → object URL).
  const [portraitUrl, setPortraitUrl] = useState(null);
  const portraitUrlRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    if (portraitUrlRef.current) {
      try { URL.revokeObjectURL(portraitUrlRef.current); } catch {}
      portraitUrlRef.current = null;
    }
    setPortraitUrl(null);
    if (!player) return;
    (async () => {
      const url = await getPortraitURL(player.playerId);
      if (cancelled) {
        if (url) { try { URL.revokeObjectURL(url); } catch {} }
        return;
      }
      portraitUrlRef.current = url;
      setPortraitUrl(url);
    })();
    return () => { cancelled = true; };
  }, [player?.playerId]);

  // Revoke any held object URL on unmount.
  useEffect(() => () => {
    if (portraitUrlRef.current) {
      try { URL.revokeObjectURL(portraitUrlRef.current); } catch {}
    }
  }, []);

  const fileInputRef = useRef(null);
  const handlePortraitUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !player) return;
    await setPortrait(player.playerId, file);
    const newUrl = await getPortraitURL(player.playerId);
    if (portraitUrlRef.current) { try { URL.revokeObjectURL(portraitUrlRef.current); } catch {} }
    portraitUrlRef.current = newUrl;
    setPortraitUrl(newUrl);
    e.target.value = "";
  };
  const handlePortraitClear = async () => {
    if (!player) return;
    await clearPortrait(player.playerId);
    if (portraitUrlRef.current) { try { URL.revokeObjectURL(portraitUrlRef.current); } catch {} }
    portraitUrlRef.current = null;
    setPortraitUrl(null);
  };

  const goPrev = () => prevId && navigateToPlayer?.(prevId);
  const goNext = () => nextId && navigateToPlayer?.(nextId);
  const goAllPlayers = () => navigateToPlayer?.(null);
  const goBack = () => { if (typeof window !== "undefined") window.history.back(); };

  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const POSITIONS = ["QB","HB","FB","WR","TE","LT","LG","C","RG","RT","LE","RE","DT","LOLB","MLB","ROLB","CB","FS","SS","K","P"];

  // Pre-compute which letters/positions actually have players (for greying out
  // empty buttons — UX polish so users don't tap dead ones).
  // NOTE: these are hooks and MUST run on every render — keep them ABOVE any
  // data-gated early return, or roster empty→full transitions throw React #310.
  const availableLetters = useMemo(() => {
    const s = new Set();
    for (const p of roster) {
      const ln = (p.lastName || "").trim();
      if (ln) s.add(ln[0].toUpperCase());
    }
    return s;
  }, [roster]);

  const availablePositions = useMemo(() => {
    const s = new Set();
    for (const p of roster) if (p.positionAbbr) s.add(p.positionAbbr);
    return s;
  }, [roster]);

  // ── Early returns (safe — ALL hooks have already run above this line) ─────
  if (!roster.length) {
    return (
      <div style={{ color: "#666", fontSize: 10 }}>
        No roster data. Upload a roster CSV in Settings.
      </div>
    );
  }

  const FilterBar = (
    <div style={{ marginBottom: 12 }}>
      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any player by name or team (e.g. Payton, CHI)"
          style={{
            width: "100%", fontSize: 11, padding: "8px 12px", borderRadius: 6,
            border: "1px solid #333", background: "#0a0a0a", color: "#e0e0e0",
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Alphabet bar (like player1.php's outputAlphabeticListing) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 6, alignItems: "center" }}>
        <span style={{ fontSize: 8, color: "#666", letterSpacing: 1, marginRight: 6, minWidth: 32 }}>BY LAST</span>
        {LETTERS.map((L) => {
          const has = availableLetters.has(L);
          const active = letterFilter === L;
          return (
            <button
              key={L}
              disabled={!has}
              onClick={() => setLetterFilter(active ? null : L)}
              style={{
                fontSize: 9, fontFamily: "inherit", cursor: has ? "pointer" : "not-allowed",
                padding: "3px 7px", borderRadius: 3,
                border: `1px solid ${active ? "#26867a" : has ? "#222" : "#1e1e1e"}`,
                background: active ? "#15201f" : "transparent",
                color: active ? "#26867a" : has ? "#bbb" : "#444",
                fontWeight: active ? "bold" : "normal",
                minWidth: 20, textAlign: "center",
              }}
              title={has ? `Players with last name starting with ${L}` : `No players starting with ${L}`}
            >
              {L}
            </button>
          );
        })}
        {(letterFilter || positionFilter) && (
          <button
            onClick={() => { setLetterFilter(null); setPositionFilter(null); }}
            style={{
              fontSize: 8, fontFamily: "inherit", cursor: "pointer", padding: "3px 8px",
              borderRadius: 3, border: "1px solid #c41e1e", background: "transparent",
              color: "#c41e1e", marginLeft: 6, letterSpacing: 1,
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Position bar (like player1.php's outputPositionListing) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <span style={{ fontSize: 8, color: "#666", letterSpacing: 1, marginRight: 6, minWidth: 32 }}>BY POS</span>
        {POSITIONS.map((P) => {
          const has = availablePositions.has(P);
          const active = positionFilter === P;
          return (
            <button
              key={P}
              disabled={!has}
              onClick={() => setPositionFilter(active ? null : P)}
              style={{
                fontSize: 9, fontFamily: "inherit", cursor: has ? "pointer" : "not-allowed",
                padding: "3px 7px", borderRadius: 3,
                border: `1px solid ${active ? "#a8651e" : has ? "#222" : "#1e1e1e"}`,
                background: active ? "#1a1208" : "transparent",
                color: active ? "#a8651e" : has ? "#bbb" : "#444",
                fontWeight: active ? "bold" : "normal",
                minWidth: 26, textAlign: "center",
              }}
            >
              {P}
            </button>
          );
        })}
      </div>

      {/* Results dropdown */}
      {searchResults.length > 0 && (
        <div style={{
          marginTop: 8,
          background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 6,
          maxHeight: 320, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
        }}>
          <div style={{ padding: "4px 10px", fontSize: 7, color: "#666", letterSpacing: 1, borderBottom: "1px solid #2a2a2a", background: "#0a0a0a" }}>
            {searchResults.length} MATCH{searchResults.length === 1 ? "" : "ES"}
            {letterFilter ? ` · LAST=${letterFilter}` : ""}
            {positionFilter ? ` · POS=${positionFilter}` : ""}
          </div>
          {searchResults.map((p) => {
            const c = teamColor(p.teamAbbr);
            return (
              <div
                key={p.playerId}
                onClick={() => pickPlayer(p.playerId)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 12px 6px 10px", borderBottom: "1px solid #2a2a2a", cursor: "pointer",
                  borderLeft: `3px solid ${c.bg}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: "bold", color: "#e0e0e0" }}>{p.firstName} {p.lastName}</div>
                  <div style={{ fontSize: 8, color: "#666" }}>
                    <span style={{ color: teamAccent(p.teamAbbr), fontWeight: "bold" }}>{p.teamAbbr}</span>
                    {" · "}{p.positionAbbr}{" · #"}{p.jerseyNumber}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: "bold", color: p.overall >= 90 ? "#d4a017" : p.overall >= 80 ? "#15803d" : "#aaa" }}>
                  {p.overall}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // No specific player selected → show a roster directory of top 50
  if (!player) {
    const topPlayers = [...roster].sort((a, b) => (b.overall || 0) - (a.overall || 0)).slice(0, 50);
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: "bold", color: "#a8651e" }}>👤 PLAYER LOOKUP</span>
          <div style={{ flex: 1 }} />
          <BulkPortraitUploader roster={roster} />
        </div>
        {FilterBar}
        <div style={{ fontSize: 9, color: "#666", marginBottom: 8, letterSpacing: 1 }}>
          TOP 50 BY OVERALL — click any player to view profile, or search above
        </div>
        <div style={{ background: "#0c0c0c", borderRadius: 8, border: "1px solid #2a2a2a", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ background: "#0a0a0a", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Team</th>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Pos</th>
                <th style={{ textAlign: "center", padding: "6px 10px" }}>OVR</th>
                <th style={{ textAlign: "center", padding: "6px 10px" }}>SPD</th>
                <th style={{ textAlign: "center", padding: "6px 10px" }}>AGE</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((p) => {
                const c = teamColor(p.teamAbbr);
                return (
                <tr
                  key={p.playerId}
                  onClick={() => pickPlayer(p.playerId)}
                  style={{ cursor: "pointer", borderBottom: "1px solid #1e1e1e", borderLeft: `3px solid ${c.bg}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1614")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "5px 10px", fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                  <td style={{ padding: "5px 10px", color: teamAccent(p.teamAbbr), fontWeight: "bold" }}>{p.teamAbbr}</td>
                  <td style={{ padding: "5px 10px", color: "#aaa" }}>{p.positionAbbr}</td>
                  <td style={{ padding: "5px 10px", textAlign: "center", color: p.overall >= 90 ? "#d4a017" : p.overall >= 80 ? "#15803d" : "#aaa", fontWeight: "bold" }}>
                    {p.overall}
                  </td>
                  <td style={{ padding: "5px 10px", textAlign: "center", color: "#aaa" }}>{p.speed}</td>
                  <td style={{ padding: "5px 10px", textAlign: "center", color: "#aaa" }}>{p.age}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Player profile (specific player) ──────────────────────

  const collegeName = colleges?.[player.collegeId] || player.collegeId || "Unknown";
  const teamC = teamColor(player.teamAbbr);

  const myStats = (() => {
    if (!playerStats?.length) return null;
    const first = (player.firstName || "").trim();
    const last  = (player.lastName  || "").trim();
    const full  = `${first} ${last}`.trim().toLowerCase();

    // 1) Exact full-name match (Player Stats CSV path)
    const exact = playerStats.find((s) => (s.playerName || "").trim().toLowerCase() === full);
    if (exact) return exact;

    // 2) Madden 08 game-log abbreviated name: "Fi Las" (~2 chars of first, ~3 of last)
    //    e.g. "Walter Payton" → "Wa Pay", "Damian Worthington" → "Da Wor"
    if (first && last) {
      const f2 = first.slice(0, 2).toLowerCase();
      const l3 = last.slice(0, 3).toLowerCase();
      const teamMatches = playerStats.filter((s) => (s.team || "").toLowerCase().includes((player.teamAbbr || "").toLowerCase()) || true);
      const fuzzy = teamMatches.find((s) => {
        const n = (s.playerName || "").trim().toLowerCase();
        // Match "fi las" or "fi. las" — the game log strips spaces oddly
        const parts = n.split(/\s+/);
        if (parts.length < 2) return false;
        return parts[0].replace(/\./g, "").startsWith(f2) && parts[parts.length - 1].startsWith(l3);
      });
      if (fuzzy) return fuzzy;
    }
    return null;
  })();

  const statRows = [
    { label: "Speed", value: player.speed },
    { label: "Acceleration", value: player.acceleration },
    { label: "Agility", value: player.agility },
    { label: "Strength", value: player.strength },
    { label: "Awareness", value: player.awareness },
    { label: "Stamina", value: player.stamina },
    { label: "Injury", value: player.injury },
    { label: "Toughness", value: player.toughness },
    { label: "Throw Power", value: player.throwPower, hl: player.positionAbbr === "QB" },
    { label: "Throw Accuracy", value: player.throwAccuracy, hl: player.positionAbbr === "QB" },
    { label: "Carry", value: player.carry, hl: ["HB", "FB"].includes(player.positionAbbr) },
    { label: "Catch", value: player.catch, hl: ["WR", "TE", "HB"].includes(player.positionAbbr) },
    { label: "Jump", value: player.jump },
    { label: "Break Tackle", value: player.breakTackle },
    { label: "Tackle", value: player.tackle, hl: ["LE", "RE", "DT", "LOLB", "MLB", "ROLB", "CB", "FS", "SS"].includes(player.positionAbbr) },
    { label: "Pass Block", value: player.passBlock, hl: ["LT", "LG", "C", "RG", "RT", "TE"].includes(player.positionAbbr) },
    { label: "Run Block", value: player.runBlock, hl: ["LT", "LG", "C", "RG", "RT", "TE"].includes(player.positionAbbr) },
    { label: "Kick Accuracy", value: player.kickAccuracy, hl: player.positionAbbr === "K" },
    { label: "Kick Power", value: player.kickPower, hl: ["K", "P"].includes(player.positionAbbr) },
    { label: "Kick Return", value: player.kickReturn },
  ];

  const ratingColor = (v) => v >= 90 ? "#d4a017" : v >= 80 ? "#15803d" : v >= 70 ? "#3b6db5" : "#888";

  const headlineRatings = [
    { label: "OVERALL", value: player.overall },
    { label: "SPEED", value: player.speed },
    { label: "AWARENESS", value: player.awareness },
    { label: "STRENGTH", value: player.strength },
    { label: "AGILITY", value: player.agility },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#a8651e" }}>👤 PLAYER PROFILE</span>
        <div style={{ flex: 1 }} />
        {/* Small circular icon navigation: back · prev · home · next */}
        <IconBtn onClick={goBack}        title="Browser back"      ariaLabel="Back">
          <ArrowIcon dir="left" stroke="#888" />
        </IconBtn>
        <IconBtn onClick={goPrev}        disabled={!prevId}        title={prevId ? "Previous player" : "No previous player"} ariaLabel="Previous player">
          <ArrowIcon dir="left" stroke={prevId ? "#bbb" : "#333"} />
        </IconBtn>
        <IconBtn onClick={goAllPlayers}  title="All players"       ariaLabel="All players">
          <HomeIcon stroke="#bbb" />
        </IconBtn>
        <IconBtn onClick={goNext}        disabled={!nextId}        title={nextId ? "Next player" : "No next player"} ariaLabel="Next player">
          <ArrowIcon dir="right" stroke={nextId ? "#bbb" : "#333"} />
        </IconBtn>
      </div>

      {FilterBar}

      {/* Player Header Card */}
      <div style={{
        background: `linear-gradient(135deg, #0c0c0c 0%, ${teamC.bg}cc 100%)`,
        borderRadius: 8, padding: 20, border: `1px solid ${teamC.bg}88`, marginBottom: 12,
        boxShadow: `0 0 24px ${teamC.bg}33`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Portrait if uploaded, otherwise jersey-badge fallback */}
          <div style={{
            position: "relative",
            width: 96, height: 96, borderRadius: 8,
            background: teamC.bg, border: `2px solid ${teamC.fg}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, overflow: "hidden",
          }}>
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={`${player.firstName} ${player.lastName}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ fontSize: 36, fontWeight: "bold", color: teamC.fg }}>
                {player.jerseyNumber}
              </div>
            )}
            {/* Hover-only upload/clear controls */}
            <div
              className="portrait-controls"
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(0,0,0,0.78)",
                padding: "3px 4px", display: "flex", gap: 4, justifyContent: "center",
                opacity: 0, transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: 7, padding: "2px 6px", border: `1px solid ${teamC.fg}`, borderRadius: 3, background: "transparent", color: teamC.fg, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, fontWeight: "bold" }}
                title="Upload portrait"
              >📷</button>
              {portraitUrl && (
                <button
                  onClick={handlePortraitClear}
                  style={{ fontSize: 7, padding: "2px 6px", border: "1px solid #dc2626", borderRadius: 3, background: "transparent", color: "#dc2626", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, fontWeight: "bold" }}
                  title="Remove portrait"
                >✕</button>
              )}
            </div>
            {/* Always-visible mouseover capture */}
            <div
              style={{ position: "absolute", inset: 0, cursor: "pointer" }}
              onMouseEnter={(e) => { const c = e.currentTarget.previousElementSibling; if (c) c.style.opacity = "1"; }}
              onMouseLeave={(e) => { const c = e.currentTarget.previousElementSibling; if (c) c.style.opacity = "0"; }}
              onClick={() => fileInputRef.current?.click()}
              title={portraitUrl ? "Click to replace portrait" : "Click to upload portrait"}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePortraitUpload}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ flex: "1 1 200px" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#fff", lineHeight: 1.1 }}>
              {player.firstName} {player.lastName}
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>
              <span
                onClick={() => navigateToTeam?.(player.teamAbbr)}
                style={{
                  color: teamC.fg, background: teamC.bg,
                  padding: "2px 8px", borderRadius: 3, fontWeight: "bold", cursor: "pointer",
                }}
              >
                {player.teamAbbr}
              </span>
              <span style={{ color: "#555", margin: "0 8px" }}>·</span>
              <span style={{ color: "#d4a017", fontWeight: "bold" }}>{player.positionAbbr}</span>
              <span style={{ color: "#555", margin: "0 8px" }}>·</span>
              <span>{player.heightDisplay}, {player.weight} lbs</span>
              <span style={{ color: "#555", margin: "0 8px" }}>·</span>
              <span>Age {player.age}</span>
            </div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>
              {collegeName} · {player.yearsPro || 0} {player.yearsPro === 1 ? "year" : "years"} pro · ID {player.playerId}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {headlineRatings.map((r) => (
              <div key={r.label} style={{ textAlign: "center", minWidth: 50 }}>
                <div style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontWeight: "bold", color: ratingColor(r.value) }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#d4a017", marginBottom: 10, letterSpacing: 1 }}>
            ATTRIBUTES
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {statRows.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 8px", background: s.hl ? "#1a1010" : "#0a0a0a",
                  borderRadius: 4, borderLeft: s.hl ? "2px solid #c41e1e" : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: 9, color: s.hl ? "#ddd" : "#888" }}>{s.label}</span>
                <span style={{ fontSize: 10, color: ratingColor(s.value), fontWeight: "bold", minWidth: 24, textAlign: "right" }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatsBlock player={player} stats={myStats} />

          <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#3b6db5", marginBottom: 10, letterSpacing: 1 }}>
              CONTRACT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", background: "#0a0a0a", borderRadius: 4 }}>
                <span style={{ color: "#666" }}>Years left</span>
                <span style={{ color: "#ddd", fontWeight: "bold" }}>{player.contractYearsLeft ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", background: "#0a0a0a", borderRadius: 4 }}>
                <span style={{ color: "#666" }}>Original yrs</span>
                <span style={{ color: "#ddd", fontWeight: "bold" }}>{player.originalContractYears ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", background: "#0a0a0a", borderRadius: 4 }}>
                <span style={{ color: "#666" }}>Current sal</span>
                <span style={{ color: "#ddd", fontWeight: "bold" }}>${(player.currentYearSal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", background: "#0a0a0a", borderRadius: 4 }}>
                <span style={{ color: "#666" }}>Bonus total</span>
                <span style={{ color: "#ddd", fontWeight: "bold" }}>${(player.signingBonusTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatsBlock — position-aware season stats display.
// Renders a separate table per category. Sections only appear if
// the player has non-zero stats in that category. Column labels
// are terse because the section header gives context.
// ─────────────────────────────────────────────────────────────
function StatsBlock({ player, stats }) {
  if (!stats) {
    return (
      <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#15803d", marginBottom: 10, letterSpacing: 1 }}>
          SEASON STATS
        </div>
        <div style={{ fontSize: 9, color: "#666", padding: "12px 0", textAlign: "center" }}>
          No game logs aggregated for this player yet
        </div>
      </div>
    );
  }

  const has = (...keys) => keys.some((k) => (stats[k] || 0) !== 0);
  const sections = [];

  // ── PASSING (QB primary, + dual-threat rushing summary inline) ──
  if (has("passAttempts", "passYards", "passTD")) {
    const totalYds = (stats.passYards || 0) + (stats.rushYards || 0);
    const totalTDs = (stats.passTD || 0) + (stats.rushTD || 0);
    sections.push(
      <StatTable
        key="passing"
        title="PASSING"
        color="#15803d"
        rows={[
          ["YARDS",         stats.passYards],
          ["TDS",           stats.passTD],
          ["CMP",           stats.passCompletions],
          ["ATT",           stats.passAttempts],
          ["INT",           stats.interceptions],
          ["RATING",        stats.passRating, "rate"],
          ["PCT",           stats.passCompletionPct, "pct"],
          ["SACK",          stats.sacksTaken],
          ["LONG",          stats.passLong],
        ]}
        footer={[
          ["RUSH YDS",      stats.rushYards],
          ["RUSH TDS",      stats.rushTD],
          ["TOTAL YDS",     totalYds, "highlight"],
          ["TOTAL TDS",     totalTDs, "highlight"],
        ]}
      />
    );
  }

  // ── RUSHING (HB/FB primary, + receiving summary inline) ──
  // Skip if already shown as QB rushing footer above.
  if (has("rushAttempts", "rushYards", "rushTD") && !has("passAttempts")) {
    const totalYds = (stats.rushYards || 0) + (stats.recYards || 0);
    const totalTDs = (stats.rushTD || 0) + (stats.recTD || 0);
    sections.push(
      <StatTable
        key="rushing"
        title="RUSHING"
        color="#c41e1e"
        rows={[
          ["YARDS",     stats.rushYards],
          ["TDS",       stats.rushTD],
          ["ATT",       stats.rushAttempts],
          ["AVG",       stats.rushAvg, "rate"],
          ["LONG",      stats.rushLong],
          ["FUM",       stats.fumbles],
        ]}
        footer={[
          ["REC YDS",   stats.recYards],
          ["REC TDS",   stats.recTD],
          ["TOTAL YDS", totalYds, "highlight"],
          ["TOTAL TDS", totalTDs, "highlight"],
        ]}
      />
    );
  }

  // ── RECEIVING (WR/TE primary; for HB it's already in rushing footer) ──
  if (has("receptions", "recYards", "recTD") && !has("rushAttempts") && !has("passAttempts")) {
    sections.push(
      <StatTable
        key="receiving"
        title="RECEIVING"
        color="#3b6db5"
        rows={[
          ["YARDS",     stats.recYards],
          ["TDS",       stats.recTD],
          ["REC",       stats.receptions],
          ["AVG",       stats.recAvg, "rate"],
          ["LONG",      stats.recLong],
          ["DROPS",     stats.drops],
          ["DROP%",     stats.dropPct, "pct"],
          ["YAC",       stats.yac],
          ["YAC AVG",   stats.yacAvg, "rate"],
        ]}
      />
    );
  }

  // ── DEFENSE ─────────────────────────────────────────
  if (has("tackles", "sacks", "defensiveInterceptions", "forcedFumbles", "tacklesForLoss", "deflections", "safeties", "catchesAllowed")) {
    sections.push(
      <StatTable
        key="defense"
        title="DEFENSE"
        color="#dc2626"
        rows={[
          ["TKL",            stats.tackles],
          ["TFL",            stats.tacklesForLoss],
          ["SACK",           stats.sacks, "rate"],
          ["FF",             stats.forcedFumbles],
          ["TFL+SK+FF",      stats.tflPlusSackPlusFF, "highlight"],
          ["INT",            stats.defensiveInterceptions],
          ["DEFLECTIONS",    stats.deflections],
          ["SAFETIES",       stats.safeties],
          ["CTH ALLOW",      stats.catchesAllowed],
        ]}
      />
    );
  }

  // ── KICKING ─────────────────────────────────────────
  if (has("fgAttempts", "xpAttempts", "kickoffs")) {
    sections.push(
      <StatTable
        key="kicking"
        title="KICKING"
        color="#d4a017"
        rows={[
          ["FGM",        stats.fgMade],
          ["FGA",        stats.fgAttempts],
          ["FG PCT",     stats.fgPct, "pct"],
          ["XPM",        stats.xpMade],
          ["XPA",        stats.xpAttempts],
          ["XP PCT",     stats.xpPct, "pct"],
          ["KICKOFFS",   stats.kickoffs],
          ["TOUCHBACKS", stats.kickoffTouchbacks],
        ]}
      />
    );
  }

  // ── PUNTING ─────────────────────────────────────────
  if (has("puntAttempts")) {
    sections.push(
      <StatTable
        key="punting"
        title="PUNTING"
        color="#a8651e"
        rows={[
          ["ATT",        stats.puntAttempts],
          ["YDS",        stats.puntYards],
          ["AVG",        stats.puntAvg, "rate"],
          ["LONG",       stats.puntLong],
          ["BLOCKS",     stats.puntsBlocked],
          ["IN20",       stats.puntsInside20],
          ["TOUCHBACKS", stats.puntTouchbacks],
        ]}
      />
    );
  }

  // ── RETURNS (KR + PR combined) ──────────────────────
  if (has("kickReturnAttempts", "puntReturnAttempts")) {
    sections.push(
      <div key="returns" style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#26867a", marginBottom: 10, letterSpacing: 1 }}>RETURNS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SubTable title="KICK RETURNS" rows={[
            ["ATT",  stats.kickReturnAttempts],
            ["YDS",  stats.kickReturnYards],
            ["AVG",  stats.kickReturnAvg, "rate"],
            ["TD",   stats.kickReturnTD],
            ["LONG", stats.kickReturnLong],
          ]} />
          <SubTable title="PUNT RETURNS" rows={[
            ["ATT",  stats.puntReturnAttempts],
            ["YDS",  stats.puntReturnYards],
            ["AVG",  stats.puntReturnAvg, "rate"],
            ["TD",   stats.puntReturnTD],
            ["LONG", stats.puntReturnLong],
          ]} />
        </div>
      </div>
    );
  }

  // ── BLOCKING (O-line) ───────────────────────────────
  if (has("pancakes", "sacksAllowed")) {
    sections.push(
      <StatTable
        key="blocking"
        title="OFFENSIVE LINE"
        color="#7c5e2e"
        rows={[
          ["PANCAKES",      stats.pancakes],
          ["SACKS ALLOWED", stats.sacksAllowed],
        ]}
      />
    );
  }

  // Header row with games played, regardless
  const header = (
    <div style={{ background: "#0c0c0c", borderRadius: 8, padding: "8px 12px", border: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#15803d", letterSpacing: 1 }}>SEASON STATS</div>
      <div style={{ fontSize: 9, color: "#888" }}>
        <span style={{ color: "#666" }}>GP </span>
        <span style={{ color: "#d4a017", fontWeight: "bold" }}>{stats.gamesPlayed || 0}</span>
      </div>
    </div>
  );

  if (sections.length === 0) {
    return (
      <>
        {header}
        <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 14, border: "1px solid #2a2a2a", fontSize: 9, color: "#666", textAlign: "center" }}>
          Player appeared in {stats.gamesPlayed || 0} game{stats.gamesPlayed === 1 ? "" : "s"} but recorded no stats.
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      {sections}
    </>
  );
}

function StatTable({ title, color, rows, footer }) {
  return (
    <div style={{ background: "#0c0c0c", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a", borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color, marginBottom: 8, letterSpacing: 1 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))", gap: 4 }}>
        {rows.map(([label, v, kind]) => (
          <StatCell key={label} label={label} value={v} kind={kind} />
        ))}
      </div>
      {footer && footer.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid #2a2a2a", margin: "10px 0 6px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))", gap: 4 }}>
            {footer.map(([label, v, kind]) => (
              <StatCell key={label} label={label} value={v} kind={kind} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SubTable({ title, rows }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: "#888", letterSpacing: 1, marginBottom: 4, fontWeight: "bold" }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: 3 }}>
        {rows.map(([label, v, kind]) => (
          <StatCell key={label} label={label} value={v} kind={kind} small />
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value, kind, small }) {
  const v = value == null ? 0 : value;
  let display;
  if (kind === "pct") display = `${(+v).toFixed(1)}%`;
  else if (kind === "rate") display = (+v).toFixed(1);
  else display = (+v).toLocaleString();
  const valueColor = kind === "highlight" ? "#d4a017" : "#e0e0e0";
  return (
    <div style={{
      background: "#0a0a0a", borderRadius: 4,
      padding: small ? "4px 6px" : "6px 8px",
      display: "flex", flexDirection: "column", alignItems: "stretch",
      borderTop: kind === "highlight" ? "1px solid #d4a01744" : "none",
    }}>
      <span style={{ fontSize: small ? 6 : 7, color: "#888", letterSpacing: 1, fontWeight: "bold" }}>{label}</span>
      <span style={{ fontSize: small ? 10 : 12, color: valueColor, fontWeight: "bold", lineHeight: 1.2 }}>{display}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small circular icon button — transparent background, thin
// border, subtle hover. Like image 3 but ~28px and integrated
// into the dark theme.
// ─────────────────────────────────────────────────────────────
function IconBtn({ onClick, disabled, title, ariaLabel, children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28, borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "transparent",
        border: `1px solid ${disabled ? "#222" : hover ? "#26867a" : "#333"}`,
        color: disabled ? "#333" : hover ? "#26867a" : "#bbb",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        transition: "all 0.12s ease",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function ArrowIcon({ dir = "left", stroke = "currentColor" }) {
  // Simple chevron, no surrounding circle (parent button is the circle).
  const path = dir === "left" ? "M13 5 L7 11 L13 17" : "M9 5 L15 11 L9 17";
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function HomeIcon({ stroke = "currentColor" }) {
  // Tiny hamburger / list icon — "all players directory"
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6"  x2="18" y2="6"  />
      <line x1="4" y1="11" x2="18" y2="11" />
      <line x1="4" y1="16" x2="18" y2="16" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// BulkPortraitUploader — folder picker that scans every file's
// name for an embedded player ID and saves matching images to
// the portraits store. Surfaces saved/skipped/conflicts counts.
// ─────────────────────────────────────────────────────────────
function BulkPortraitUploader({ roster }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [haveCount, setHaveCount] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    listPortraitIds().then((s) => { if (!cancelled) setHaveCount(s.size); });
    return () => { cancelled = true; };
  }, []);

  const knownIds = React.useMemo(
    () => new Set(roster.map((p) => String(p.playerId))),
    [roster]
  );

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setResult(null);
    const r = await setBulkPortraits(files, knownIds);
    setBusy(false);
    setResult(r);
    // refresh count
    const s = await listPortraitIds();
    setHaveCount(s.size);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {haveCount != null && (
        <span style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>
          {haveCount} PORTRAIT{haveCount === 1 ? "" : "S"} STORED
        </span>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          fontSize: 9, fontFamily: "inherit", padding: "5px 12px", borderRadius: 4,
          border: "1px solid #a8651e", background: "#a8651e22",
          color: "#a8651e", cursor: busy ? "wait" : "pointer", letterSpacing: 1, fontWeight: "bold",
        }}
        title="Upload a folder — filenames should contain the player ID (e.g. 12345.jpg or 12345_lastname.png)"
      >
        {busy ? "UPLOADING…" : "📁 BULK UPLOAD PORTRAITS"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        // webkitdirectory enables folder selection in Chromium/WebKit; multiple files works as fallback
        webkitdirectory=""
        directory=""
        onChange={onPick}
        style={{ display: "none" }}
      />
      {result && (
        <span style={{ fontSize: 8, color: "#aaa", letterSpacing: 1 }}>
          ✓ <span style={{ color: "#22c55e", fontWeight: "bold" }}>{result.saved}</span> saved
          {result.skipped > 0 && <> · <span style={{ color: "#888" }}>{result.skipped} skipped</span></>}
          {result.conflicts > 0 && <> · <span style={{ color: "#dc2626" }}>{result.conflicts} unknown IDs</span></>}
        </span>
      )}
    </div>
  );
}

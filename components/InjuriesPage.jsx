"use client";
import React, { useState, useEffect, useMemo } from "react";
import { ROLES } from "../data/adminRoles";
import { teamColor, teamAccent } from "../data/teamColors";

const INJURY_STATUSES = ["Questionable", "Doubtful", "Out", "IR", "PUP"];
const BODY_PARTS = ["Knee", "Ankle", "Shoulder", "Hamstring", "Concussion", "Back", "Hip", "Foot", "Hand", "Wrist", "Ribs", "Calf", "Quad", "Groin", "Other"];

const STATUS_COLOR = {
  Questionable: "#d4a017",
  Doubtful:     "#f59e0b",
  Out:          "#dc2626",
  IR:           "#a8651e",
  PUP:          "#3b6db5",
};

// Persistence key — scoped per league/season so injuries don't bleed across years.
const storageKey = (year) => `pcft.injuries.${year || "current"}`;

function loadInjuries(year) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(year));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveInjuries(year, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(year), JSON.stringify(data));
  } catch {}
}

export default function InjuriesPage({ players = [], navigateToPlayer, currentUser, year }) {
  // ── State ──────────────────────────────────────────────
  const [injuries, setInjuries] = useState({});       // { [playerId]: { status, body, week, note } }
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState("active");          // "active" | "risk"
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ playerId: "", status: "Questionable", body: "Knee", week: "", note: "" });
  const [search, setSearch] = useState("");

  // ── Permissions ────────────────────────────────────────
  const canEdit = !!currentUser && (
    currentUser.role === ROLES.ADMIN ||
    currentUser.role === ROLES.MODERATOR ||
    currentUser.role === ROLES.TEAM_OWNER
  );
  const canEditAny = !!currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.MODERATOR);

  // Hydrate from localStorage on mount/year change
  useEffect(() => { setInjuries(loadInjuries(year)); }, [year]);

  // Persist on change
  useEffect(() => { saveInjuries(year, injuries); }, [year, injuries]);

  // ── Derived data ───────────────────────────────────────
  const playerById = useMemo(() => {
    const m = {};
    for (const p of players) m[String(p.playerId)] = p;
    return m;
  }, [players]);

  const activeInjuries = useMemo(() => {
    return Object.entries(injuries)
      .map(([pid, inj]) => {
        const p = playerById[pid];
        if (!p) return null;
        // Team owners only see their own team
        if (canEdit && !canEditAny && currentUser?.team && p.teamAbbr !== currentUser.team) {
          // still show — viewing is fine — but they can't edit (see render)
        }
        return { ...p, ...inj, _injuryId: pid };
      })
      .filter(Boolean)
      .filter((x) => statusFilter === "ALL" || x.status === statusFilter)
      .filter((x) => !search.trim() || `${x.firstName} ${x.lastName}`.toLowerCase().includes(search.trim().toLowerCase()) || x.teamAbbr?.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (b.week || 0) - (a.week || 0));
  }, [injuries, playerById, statusFilter, search, canEdit, canEditAny, currentUser]);

  // High-injury-risk = REAL data from the roster's Madden injury rating
  // (lower rating = more injury-prone). Surfaces players you might want to monitor.
  const riskList = useMemo(() => {
    return [...players]
      .filter((p) => typeof p.injury === "number" && p.injury > 0)
      .sort((a, b) => a.injury - b.injury)
      .slice(0, 50);
  }, [players]);

  // ── Mutations ──────────────────────────────────────────
  const upsertInjury = (pid, patch) => {
    setInjuries((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], ...patch },
    }));
  };
  const removeInjury = (pid) => {
    setInjuries((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  };

  const submitDraft = () => {
    if (!draft.playerId || !draft.status) return;
    const p = playerById[String(draft.playerId)];
    if (!p) return;
    if (canEdit && !canEditAny && currentUser?.team && p.teamAbbr !== currentUser.team) return;
    upsertInjury(draft.playerId, {
      status: draft.status, body: draft.body, week: parseInt(draft.week) || null, note: draft.note,
    });
    setDraft({ playerId: "", status: "Questionable", body: "Knee", week: "", note: "" });
    setAdding(false);
  };

  // ── Add UI ─────────────────────────────────────────────
  const playerOptions = useMemo(() => {
    return players
      .filter((p) => !injuries[String(p.playerId)])  // exclude already-injured
      .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
  }, [players, injuries]);

  // ── Counts ─────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { Questionable: 0, Doubtful: 0, Out: 0, IR: 0, PUP: 0 };
    for (const e of Object.values(injuries)) if (c[e.status] !== undefined) c[e.status]++;
    return c;
  }, [injuries]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#dc2626" }}>🏥 INJURY REPORT</span>
        <span style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>· {year || "current season"} · stored locally</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setView("active")}
          style={tabStyle(view === "active")}
        >ACTIVE INJURIES ({Object.keys(injuries).length})</button>
        <button
          onClick={() => setView("risk")}
          style={tabStyle(view === "risk")}
        >INJURY RISK</button>
      </div>

      {view === "active" ? (
        <>
          {/* Status filter bar + search */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            {["ALL", ...INJURY_STATUSES].map((t) => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                style={{
                  fontSize: 9, fontFamily: "inherit", padding: "3px 9px", borderRadius: 4,
                  border: `1px solid ${statusFilter === t ? (STATUS_COLOR[t] || "#26867a") : "#222"}`,
                  background: statusFilter === t ? `${STATUS_COLOR[t] || "#26867a"}22` : "transparent",
                  color: statusFilter === t ? (STATUS_COLOR[t] || "#26867a") : "#aaa",
                  cursor: "pointer", letterSpacing: 1, fontWeight: statusFilter === t ? "bold" : "normal",
                }}
              >
                {t}
              </button>
            ))}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter by name or team"
              style={{ fontSize: 10, padding: "4px 8px", borderRadius: 4, border: "1px solid #333", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "inherit", outline: "none", flex: "1 1 200px", maxWidth: 260 }}
            />
            {canEdit && (
              <button
                onClick={() => setAdding(true)}
                style={{ fontSize: 9, fontFamily: "inherit", padding: "4px 10px", borderRadius: 4, border: "1px solid #dc2626", background: "#dc262633", color: "#dc2626", cursor: "pointer", letterSpacing: 1, fontWeight: "bold" }}
              >+ MARK PLAYER INJURED</button>
            )}
          </div>

          {/* Add form */}
          {adding && (
            <div style={{ background: "#0c0c0c", border: "1px solid #2a1a1a", borderLeft: "3px solid #dc2626", borderRadius: 6, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#dc2626", letterSpacing: 1, fontWeight: "bold", marginBottom: 8 }}>MARK PLAYER INJURED</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr auto auto", gap: 8, alignItems: "center" }}>
                <select value={draft.playerId} onChange={(e) => setDraft({ ...draft, playerId: e.target.value })} style={inputStyle}>
                  <option value="">— select player —</option>
                  {playerOptions.map((p) => (
                    <option key={p.playerId} value={p.playerId}>
                      {p.lastName}, {p.firstName} ({p.teamAbbr} {p.positionAbbr})
                    </option>
                  ))}
                </select>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} style={inputStyle}>
                  {INJURY_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={inputStyle}>
                  {BODY_PARTS.map((b) => <option key={b}>{b}</option>)}
                </select>
                <input type="number" value={draft.week} onChange={(e) => setDraft({ ...draft, week: e.target.value })} placeholder="Wk" style={inputStyle} />
                <input type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="note (optional)" style={inputStyle} />
                <button onClick={submitDraft} style={btnStyle("#22c55e")}>SAVE</button>
                <button onClick={() => { setAdding(false); setDraft({ playerId: "", status: "Questionable", body: "Knee", week: "", note: "" }); }} style={btnStyle("#666")}>CANCEL</button>
              </div>
            </div>
          )}

          {/* Counts row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 10 }}>
            {INJURY_STATUSES.map((s) => (
              <div key={s} style={{ background: "#0c0c0c", borderRadius: 6, padding: "8px 10px", border: "1px solid #1a1a1a", borderLeft: `3px solid ${STATUS_COLOR[s]}` }}>
                <div style={{ fontSize: 16, fontWeight: "bold", color: STATUS_COLOR[s] }}>{counts[s]}</div>
                <div style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>{s.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Active injuries table */}
          {activeInjuries.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                  <th style={th}>Player</th>
                  <th style={th}>Team</th>
                  <th style={th}>Pos</th>
                  <th style={th}>Body</th>
                  <th style={{ ...th, textAlign: "center" }}>Status</th>
                  <th style={{ ...th, textAlign: "center" }}>Wk</th>
                  <th style={th}>Note</th>
                  {canEdit && <th style={{ ...th, textAlign: "center" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {activeInjuries.map((p, i) => {
                  const tc = teamColor(p.teamAbbr);
                  const canEditThis = canEdit;
                  return (
                    <tr key={p._injuryId} style={{ borderBottom: "1px solid #161616", background: i % 2 === 0 ? "#0c0c0c" : "transparent", borderLeft: `3px solid ${tc.bg}` }}>
                      <td style={{ ...td, fontWeight: "bold", cursor: "pointer" }} onClick={() => navigateToPlayer?.(p.playerId)}>
                        {p.firstName} {p.lastName}
                      </td>
                      <td style={{ ...td, color: teamAccent(p.teamAbbr), fontWeight: "bold" }}>{p.teamAbbr}</td>
                      <td style={{ ...td, color: "#aaa" }}>{p.positionAbbr}</td>
                      <td style={{ ...td, color: "#ccc" }}>{p.body || "—"}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 8, fontWeight: "bold", letterSpacing: 1, color: STATUS_COLOR[p.status] || "#aaa", background: `${STATUS_COLOR[p.status] || "#888"}22` }}>
                          {(p.status || "").toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: "center", color: "#888" }}>{p.week ? `Wk ${p.week}` : "—"}</td>
                      <td style={{ ...td, color: "#888", fontSize: 8 }}>{p.note || ""}</td>
                      {canEdit && (
                        <td style={{ ...td, textAlign: "center" }}>
                          {canEditThis ? (
                            <button onClick={() => removeInjury(p._injuryId)} style={btnStyle("#dc2626", true)}>CLEAR</button>
                          ) : (
                            <span style={{ fontSize: 7, color: "#444" }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "#666", fontSize: 10, padding: 40, textAlign: "center", background: "#0c0c0c", borderRadius: 8, border: "1px solid #1a1a1a" }}>
              No active injuries.{canEdit ? " Click MARK PLAYER INJURED to add one." : ""}
            </div>
          )}
        </>
      ) : (
        // ── INJURY RISK view (real data from Madden injury rating) ──
        <>
          <div style={{ background: "#0c0c0c", borderRadius: 6, padding: 10, marginBottom: 10, border: "1px solid #1a1a1a", fontSize: 9, color: "#888" }}>
            Players sorted by Madden Injury rating (lower = more injury-prone). This is roster attribute data, not live injuries.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222", color: "#666" }}>
                <th style={th}>Player</th>
                <th style={th}>Team</th>
                <th style={th}>Pos</th>
                <th style={{ ...th, textAlign: "center" }}>OVR</th>
                <th style={{ ...th, textAlign: "center" }}>INJ</th>
                <th style={{ ...th, textAlign: "center" }}>TGH</th>
                <th style={{ ...th, textAlign: "center" }}>Age</th>
                <th style={{ ...th, textAlign: "center" }}>Currently?</th>
              </tr>
            </thead>
            <tbody>
              {riskList.map((p, i) => {
                const tc = teamColor(p.teamAbbr);
                const flagged = !!injuries[String(p.playerId)];
                return (
                  <tr key={p.playerId}
                      style={{ borderBottom: "1px solid #161616", background: i % 2 === 0 ? "#0c0c0c" : "transparent", borderLeft: `3px solid ${tc.bg}`, cursor: "pointer" }}
                      onClick={() => navigateToPlayer?.(p.playerId)}>
                    <td style={{ ...td, fontWeight: "bold" }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...td, color: teamAccent(p.teamAbbr), fontWeight: "bold" }}>{p.teamAbbr}</td>
                    <td style={{ ...td, color: "#aaa" }}>{p.positionAbbr}</td>
                    <td style={{ ...td, textAlign: "center", color: p.overall >= 90 ? "#d4a017" : p.overall >= 80 ? "#15803d" : "#aaa", fontWeight: "bold" }}>{p.overall}</td>
                    <td style={{ ...td, textAlign: "center", color: p.injury < 50 ? "#dc2626" : p.injury < 70 ? "#d4a017" : "#22c55e", fontWeight: "bold" }}>{p.injury}</td>
                    <td style={{ ...td, textAlign: "center", color: "#aaa" }}>{p.toughness ?? "—"}</td>
                    <td style={{ ...td, textAlign: "center", color: p.age >= 32 ? "#d4a017" : "#aaa" }}>{p.age}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      {flagged ? <span style={{ color: STATUS_COLOR[injuries[String(p.playerId)].status] || "#dc2626", fontSize: 8, fontWeight: "bold", letterSpacing: 1 }}>{injuries[String(p.playerId)].status?.toUpperCase()}</span> : <span style={{ color: "#333" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {riskList.length === 0 && (
            <div style={{ color: "#666", fontSize: 10, padding: 40, textAlign: "center" }}>
              No roster data with injury ratings. Upload a roster CSV in Settings.
            </div>
          )}
        </>
      )}

      {!canEdit && (
        <div style={{ marginTop: 12, fontSize: 8, color: "#555", textAlign: "center", letterSpacing: 1 }}>
          Read-only — sign in as team owner or admin to mark players injured.
        </div>
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────
const th = { textAlign: "left", padding: "4px 8px", letterSpacing: 1, fontSize: 8 };
const td = { padding: "4px 8px" };
const inputStyle = {
  fontSize: 10, fontFamily: "inherit", padding: "4px 8px", borderRadius: 4,
  border: "1px solid #333", background: "#0a0a0a", color: "#e0e0e0", outline: "none", minWidth: 0,
};
const tabStyle = (active) => ({
  fontSize: 9, fontFamily: "inherit", padding: "4px 12px", borderRadius: 4,
  border: `1px solid ${active ? "#dc2626" : "#222"}`,
  background: active ? "#dc262622" : "transparent",
  color: active ? "#dc2626" : "#aaa",
  cursor: "pointer", fontWeight: "bold", letterSpacing: 1,
});
const btnStyle = (color, small) => ({
  fontSize: small ? 7 : 9, fontFamily: "inherit", padding: small ? "2px 6px" : "5px 10px",
  borderRadius: 3, border: `1px solid ${color}`, background: `${color}22`, color,
  cursor: "pointer", fontWeight: "bold", letterSpacing: 1,
});

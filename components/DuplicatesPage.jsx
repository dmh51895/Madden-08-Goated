"use client";
import React, { useState, useMemo } from "react";
import { suggestRenames } from "../data/duplicates";

export default function DuplicatesPage({ duplicates = [], onApplyRenames }) {
  // edits[playerId] = { firstName, lastName }
  const [edits, setEdits] = useState({});
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return duplicates;
    const f = filter.toLowerCase();
    return duplicates.filter((d) => d.name.toLowerCase().includes(f));
  }, [duplicates, filter]);

  const setField = (playerId, field, value) => {
    setEdits((prev) => ({ ...prev, [playerId]: { ...(prev[playerId] || {}), [field]: value } }));
  };

  const suggestForGroup = (dupe) => {
    const s = suggestRenames(dupe);
    setEdits((prev) => ({ ...prev, ...s }));
  };
  const suggestAll = () => {
    const all = {};
    duplicates.forEach((d) => Object.assign(all, suggestRenames(d)));
    setEdits((prev) => ({ ...prev, ...all }));
  };

  const apply = () => {
    if (Object.keys(edits).length === 0) return;
    onApplyRenames(edits);
    setEdits({});
  };

  const dirty = Object.keys(edits).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff9d4d" }}>🪪 DUPLICATE NAMES</span>
        <span style={{ fontSize: 8, color: "#666" }}>
          {duplicates.length} groups · {duplicates.reduce((sum, d) => sum + d.count, 0)} players affected
        </span>
        <div style={{ flex: 1 }} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter names..."
          style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#ff9d4d", fontFamily: "inherit", outline: "none", width: 180 }}
        />
        <button
          onClick={suggestAll}
          disabled={!duplicates.length}
          style={{ fontSize: 8, padding: "3px 8px", borderRadius: 6, border: "1px solid #7c8cff", background: "#7c8cff22", color: "#7c8cff", cursor: "pointer", opacity: duplicates.length ? 1 : 0.4 }}
        >
          Suggest all (II, III, …)
        </button>
        <button
          onClick={apply}
          disabled={!dirty}
          style={{ fontSize: 8, padding: "3px 10px", borderRadius: 6, border: `1px solid ${dirty ? "#00d8a8" : "#333"}`, background: dirty ? "#00d8a822" : "transparent", color: dirty ? "#00d8a8" : "#666", cursor: dirty ? "pointer" : "default" }}
        >
          Apply {dirty ? `(${dirty})` : ""}
        </button>
      </div>

      <div style={{ background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 9, color: "#aaa" }}>
        Players sharing identical first + last names break stat attribution from
        game logs (the log only writes the printed name). Rename one or more so
        every player on every roster has a unique name. The first row in each
        group is left as-is by default — edit any field directly or use the
        per-group "Suggest" button.
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#666", fontSize: 10 }}>
          {duplicates.length === 0 ? "No duplicate names found. ✓" : "No matches."}
        </div>
      )}

      {filtered.map((dupe) => (
        <div key={dupe.name} style={{ background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: "bold", color: "#ff9d4d" }}>{dupe.name}</span>
            <span style={{ fontSize: 8, color: "#666", marginLeft: 8 }}>× {dupe.count}</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => suggestForGroup(dupe)}
              style={{ fontSize: 7, padding: "2px 6px", borderRadius: 4, border: "1px solid #7c8cff", background: "#7c8cff22", color: "#7c8cff", cursor: "pointer" }}
            >
              Suggest
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>Team</th>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>Pos</th>
                <th style={{ textAlign: "center", padding: "3px 6px" }}>OVR</th>
                <th style={{ textAlign: "center", padding: "3px 6px" }}>Age</th>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>First Name →</th>
                <th style={{ textAlign: "left", padding: "3px 6px" }}>Last Name →</th>
              </tr>
            </thead>
            <tbody>
              {dupe.players.map((p) => {
                const edit = edits[p.playerId] || {};
                const fn = edit.firstName !== undefined ? edit.firstName : p.firstName;
                const ln = edit.lastName !== undefined ? edit.lastName : p.lastName;
                const changed = (fn !== p.firstName) || (ln !== p.lastName);
                return (
                  <tr key={p.playerId} style={{ borderBottom: "1px solid #2a2a2a", background: changed ? "#1a1a0a" : "transparent" }}>
                    <td style={{ padding: "3px 6px", color: "#ff4500" }}>{p.team}</td>
                    <td style={{ padding: "3px 6px", color: "#c77dff" }}>{p.position}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: p.overall >= 90 ? "#ffd700" : "#aaa" }}>{p.overall}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: "#aaa" }}>{p.age}</td>
                    <td style={{ padding: "3px 6px" }}>
                      <input
                        value={fn}
                        onChange={(e) => setField(p.playerId, "firstName", e.target.value)}
                        style={{ width: "100%", fontSize: 9, padding: "2px 4px", borderRadius: 3, border: `1px solid ${changed ? "#ffd700" : "#333"}`, background: "#111", color: changed ? "#ffd700" : "#aaa", fontFamily: "inherit", outline: "none" }}
                      />
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      <input
                        value={ln}
                        onChange={(e) => setField(p.playerId, "lastName", e.target.value)}
                        style={{ width: "100%", fontSize: 9, padding: "2px 4px", borderRadius: 3, border: `1px solid ${changed ? "#ffd700" : "#333"}`, background: "#111", color: changed ? "#ffd700" : "#aaa", fontFamily: "inherit", outline: "none" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

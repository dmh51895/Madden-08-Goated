"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

// Promise-based confirmation dialog. Wrap the app once in <ConfirmProvider>,
// then anywhere under it: const confirm = useConfirm();  if (!(await confirm({...}))) return;
const ConfirmCtx = createContext(async () => true);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null); // { title, body, confirmLabel, danger, resolve }

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setReq({
        title: opts.title || "Confirm change",
        body: opts.body || "Apply this change?",
        confirmLabel: opts.confirmLabel || "OK",
        danger: !!opts.danger,
        resolve,
      });
    });
  }, []);

  const close = (val) => { if (req) req.resolve(val); setReq(null); };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <div
          onClick={() => close(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.72)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: "#0c0c0c", border: "1px solid #1f2a28",
              borderTop: `3px solid ${req.danger ? "#c41e1e" : "#26867a"}`,
              borderRadius: 8, padding: 22, maxWidth: 440, width: "100%",
              fontFamily: "inherit", boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 10, color: req.danger ? "#e05656" : "#26867a" }}>
              {req.title}
            </div>
            <div style={{ fontSize: 11.5, color: "#ccc", lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-wrap" }}>
              {req.body}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => close(false)}
                style={{ fontSize: 10, fontFamily: "inherit", padding: "8px 18px", borderRadius: 4, cursor: "pointer", border: "1px solid #333", background: "transparent", color: "#bbb", letterSpacing: 0.5 }}
              >
                Cancel
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                style={{ fontSize: 10, fontFamily: "inherit", padding: "8px 18px", borderRadius: 4, cursor: "pointer", border: "none", fontWeight: "bold", letterSpacing: 0.5, color: "#fff", background: req.danger ? "#8f1414" : "#194E4E" }}
              >
                {req.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

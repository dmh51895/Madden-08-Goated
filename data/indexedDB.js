// ── IndexedDB Persistent Store ─────────────────────────────
// Replaces localStorage for reliable cross-session, cross-panel persistence.
// Async API wrapped in a sync-style interface for React state.

const DB_NAME = "pcft-league";
const DB_VERSION = 1;
const STORE_NAME = "league";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { resolve(null); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Public API ─────────────────────────────────────────────

export async function loadDB() {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("data");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB load failed:", e);
    return null;
  }
}

export async function saveDB(data) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, "data");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB save failed:", e);
  }
}

export async function clearDB() {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB clear failed:", e);
  }
}

// ── Sync helpers (for initial render before async loads) ───

const DEFAULT_DATA = {
  currentSeason: 2024,
  seasons: {},
  currentUser: null,
  users: {},
};

// Immediately available (returns defaults, then async loads real data)
export function getDefaultData() {
  return { ...DEFAULT_DATA };
}

// Migration: pull from old localStorage key if IndexedDB is empty
export async function migrateFromLocalStorage(storageKey = "pcft-league-data") {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      await saveDB(parsed);
      localStorage.removeItem(storageKey);
      return parsed;
    }
  } catch (e) {
    console.warn("localStorage migration failed:", e);
  }
  return null;
}

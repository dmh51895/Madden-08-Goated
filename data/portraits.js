// ── Player Portrait Store ──────────────────────────────────
// Lives in its own IndexedDB object store (not in the league data
// blob) because 1,859 player images would balloon the main store
// to ~90MB and slow every read/write. Each portrait is keyed by
// playerId and stored as a Blob (~10× smaller than data URLs).

const DB_NAME = "pcft-portraits";
const DB_VERSION = 1;
const STORE_NAME = "portraits";

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
    req.onerror   = () => reject(req.error);
  });
}

/** Fetch the portrait blob for a player. Returns null if none stored. */
export async function getPortrait(playerId) {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(String(playerId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

/** Store a portrait Blob for a player. */
export async function setPortrait(playerId, blob) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(blob, String(playerId));
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch (e) { console.error("portrait save failed:", e); }
}

/** Remove a single portrait. */
export async function clearPortrait(playerId) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(String(playerId));
      req.onsuccess = () => resolve();
      req.onerror   = () => resolve();
    });
  } catch {}
}

/** Return the set of all playerIds that have portraits stored. */
export async function listPortraitIds() {
  try {
    const db = await openDB();
    if (!db) return new Set();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve(new Set(req.result.map(String)));
      req.onerror   = () => resolve(new Set());
    });
  } catch { return new Set(); }
}

/** Wipe all portraits (e.g. settings → reset). */
export async function clearAllPortraits() {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => resolve();
    });
  } catch {}
}

/**
 * Bulk upload helper.
 * Accepts an array of File objects (from a folder upload).
 * Tries hard to extract a player ID from each filename:
 *   "12345.jpg"            → 12345
 *   "12345_payton.png"     → 12345
 *   "p12345.webp"          → 12345
 *   "payton_walter_12345.jpg" → 12345 (longest numeric run wins)
 *
 * Returns { saved, skipped, conflicts } counts.
 */
export async function setBulkPortraits(files, knownPlayerIds = null) {
  const knownSet = knownPlayerIds ? new Set([...knownPlayerIds].map(String)) : null;
  let saved = 0, skipped = 0, conflicts = 0;
  for (const file of files) {
    if (!file || !file.type || !file.type.startsWith("image/")) { skipped++; continue; }
    const base = (file.name || "").replace(/\.[^.]+$/, "");          // drop extension
    // Find every numeric run, pick the longest (most likely the ID)
    const matches = base.match(/\d+/g) || [];
    if (!matches.length) { skipped++; continue; }
    const pid = matches.sort((a, b) => b.length - a.length)[0];
    if (knownSet && !knownSet.has(pid)) { conflicts++; continue; }
    await setPortrait(pid, file);
    saved++;
  }
  return { saved, skipped, conflicts };
}

/**
 * Hook-friendly helper: returns a one-shot URL.createObjectURL string
 * for the player's portrait, or null. Caller is responsible for revoking.
 */
export async function getPortraitURL(playerId) {
  const blob = await getPortrait(playerId);
  if (!blob) return null;
  try { return URL.createObjectURL(blob); } catch { return null; }
}

import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch, increment, query, limit,
} from "firebase/firestore";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyDNgGC-3qksHbOWsKcEh50_5ZE6wH3n8aQ",
  authDomain: "dnd-tools-1dd87.firebaseapp.com",
  projectId: "dnd-tools-1dd87",
  storageBucket: "dnd-tools-1dd87.firebasestorage.app",
  messagingSenderId: "866582352851",
  appId: "1:866582352851:web:269ec8b40fc5764425d526"
});
export const db = getFirestore(firebaseApp);

// Firestore rejects undefined field values; the old JSON-blob storage silently
// dropped them, so keep that behavior.
const clean = (obj) => JSON.parse(JSON.stringify(obj));

// One-time migration: the legacy format stored each list as a single JSON blob
// in kv/<name>. Copy every item into its own doc in the <name> collection, then
// leave a marker so an emptied collection is never re-populated from the blob.
// The legacy kv doc itself is kept untouched as a backup.
async function migrateFromKv(name, toDocs) {
  const markerRef = doc(db, "kv", `${name}-migrated`);
  if ((await getDoc(markerRef)).exists()) return;
  const probe = await getDocs(query(collection(db, name), limit(1)));
  if (probe.empty) {
    const legacy = await getDoc(doc(db, "kv", name));
    if (legacy.exists()) {
      const entries = toDocs(JSON.parse(legacy.data().value));
      for (let i = 0; i < entries.length; i += 400) {
        const batch = writeBatch(db);
        for (const [id, data] of entries.slice(i, i + 400)) batch.set(doc(db, name, id), clean(data));
        await batch.commit();
      }
    }
  }
  await setDoc(markerRef, { ts: Date.now() });
}

// Live-synced list stored as one Firestore doc per item (doc id = item.id),
// ordered by ts. update(nextArray) keeps the old whole-array API: it diffs
// against the last known state and only writes/deletes the items that changed,
// so concurrent editors no longer overwrite each other's items.
export function useSyncedList(name, { order = "desc" } = {}) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const latest = useRef([]);
  const sorted = (arr) => [...arr].sort((a, b) =>
    order === "asc" ? (a.ts || 0) - (b.ts || 0) : (b.ts || 0) - (a.ts || 0));

  useEffect(() => {
    let unsub = null, cancelled = false;
    (async () => {
      try {
        // Legacy arrays were newest-first for "desc" lists and oldest-first for
        // "asc" lists; assign missing ts so the ts sort preserves that order.
        await migrateFromKv(name, (value) => {
          const arr = Array.isArray(value) ? value : [];
          const base = Date.now();
          return arr.map((item, i) => {
            const ts = item.ts ?? (order === "asc" ? base + i : base - i);
            const id = String(item.id ?? `${base.toString(36)}-${i}`);
            return [id, { ...item, id, ts }];
          });
        });
      } catch (e) { console.error(`Migration failed for ${name}`, e); }
      if (cancelled) return;
      unsub = onSnapshot(collection(db, name),
        (snap) => {
          latest.current = sorted(snap.docs.map(d => d.data()));
          setItems(latest.current);
          setReady(true);
        },
        (e) => { console.error(`Sync failed for ${name}`, e); setReady(true); });
    })();
    return () => { cancelled = true; unsub?.(); };
  }, [name]);

  const update = (next) => {
    const prev = latest.current;
    const prevById = new Map(prev.map(item => [item.id, item]));
    const now = Date.now();
    const withTs = next.map(item => item.ts == null ? { ...item, ts: now } : item);
    const nextIds = new Set(withTs.map(item => item.id));
    const writes = [];
    for (const item of withTs) {
      const old = prevById.get(item.id);
      if (old === item) continue;
      const data = clean(item);
      if (old && JSON.stringify(data) === JSON.stringify(clean(old))) continue;
      writes.push(setDoc(doc(db, name, String(item.id)), data));
    }
    for (const old of prev) {
      if (!nextIds.has(old.id)) writes.push(deleteDoc(doc(db, name, String(old.id))));
    }
    // Optimistic local update; the snapshot listener confirms it right after.
    latest.current = sorted(withTs);
    setItems(latest.current);
    Promise.all(writes).catch(e => console.error(`Save failed for ${name}`, e));
  };

  return [items, update, ready];
}

// Reactions live in their own collection: one doc per recap (doc id = recap id)
// with a `counts` map of emoji -> number. Increments are atomic, so two players
// reacting at the same moment both count.
export function useSyncedReactions(name) {
  const [reactions, setReactions] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub = null, cancelled = false;
    (async () => {
      try {
        await migrateFromKv(name, (value) =>
          Object.entries(value || {}).map(([id, counts]) => [id, { counts: counts || {} }]));
      } catch (e) { console.error(`Migration failed for ${name}`, e); }
      if (cancelled) return;
      unsub = onSnapshot(collection(db, name),
        (snap) => {
          const map = {};
          snap.docs.forEach(d => { map[d.id] = d.data().counts || {}; });
          setReactions(map);
          setReady(true);
        },
        (e) => { console.error(`Sync failed for ${name}`, e); setReady(true); });
    })();
    return () => { cancelled = true; unsub?.(); };
  }, [name]);

  const react = (id, emoji) => {
    setReactions(r => ({ ...r, [id]: { ...(r[id] || {}), [emoji]: ((r[id] || {})[emoji] || 0) + 1 } }));
    setDoc(doc(db, name, id), { counts: { [emoji]: increment(1) } }, { merge: true })
      .catch(e => console.error(`Save failed for ${name}`, e));
  };

  return [reactions, react, ready];
}

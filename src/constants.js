export function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
export function formatDate(ts) { return new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }); }

export const REACTIONS = ["✨","💀","😂","❤️","🎲","😱"];
export const DEFAULT_PIN = "1234";
export const NPC_STATUSES = [
  { id: "lebendig", label: "Lebendig", color: "#6fae86" },
  { id: "tot",      label: "Tot",      color: "#d89a8e" },
  { id: "vermisst", label: "Vermisst", color: "#e3c46a" },
  { id: "unbekannt",label: "Unbekannt",color: "#c2b896" },
];

// Orte auf Iere — Monsterhearts spielt zwischen Schule, Zuhause und den
// Rändern der Stadt, nicht in Dungeons.
export const NPC_LOCATIONS = [
  { id: "all",       label: "Alle",       icon: "✦" },
  { id: "schule",    label: "Schule",     icon: "🏫" },
  { id: "zuhause",   label: "Zuhause",    icon: "🛏" },
  { id: "stadt",     label: "Stadt",      icon: "🌆" },
  { id: "karneval",  label: "Karneval",   icon: "🎭" },
  { id: "strand",    label: "Strand",     icon: "🌊" },
  { id: "busch",     label: "Der Busch",  icon: "🌴" },
  { id: "kirche",    label: "Kirche",     icon: "⛪" },
  { id: "unbekannt", label: "Unbekannt",  icon: "❓" },
];

// Gespeicherte NPCs tragen teils noch die alten Witchlight-Orte. Sie sollen
// nicht ins Leere zeigen: der Karnival wird zum Karneval, der Rest landet unter
// "Unbekannt" und kann neu einsortiert werden.
const LEGACY_NPC_LOCATIONS = { karnival: "karneval", hither: "unbekannt", tither: "unbekannt", yon: "unbekannt", palast: "unbekannt" };
export function npcLocationId(id) {
  const resolved = LEGACY_NPC_LOCATIONS[id] || id || "unbekannt";
  return NPC_LOCATIONS.some(l => l.id === resolved) ? resolved : "unbekannt";
}
export function npcLocation(id) { return NPC_LOCATIONS.find(l => l.id === npcLocationId(id)); }

export const NPC_SORT_OPTIONS = [
  { id: "alpha",  label: "A → Z",     icon: "🔤" },
  { id: "alpha-r",label: "Z → A",     icon: "🔤" },
  { id: "status", label: "Status",    icon: "💚" },
  { id: "newest", label: "Neueste",   icon: "🕐" },
  { id: "oldest", label: "Älteste",   icon: "🕐" },
];

const STATUS_ORDER = ["lebendig", "vermisst", "unbekannt", "tot"];

export function sortNpcs(npcs, sortBy) {
  const sorted = [...npcs];
  switch (sortBy) {
    case "alpha":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "de"));
    case "alpha-r":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "de"));
    case "status":
      return sorted.sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(a.status || "unbekannt");
        const bi = STATUS_ORDER.indexOf(b.status || "unbekannt");
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name, "de");
      });
    case "newest":
      return sorted.sort((a, b) => {
        const ta = typeof a.id === "string" ? parseInt(a.id.split("").slice(0, 8).join(""), 36) : 0;
        const tb = typeof b.id === "string" ? parseInt(b.id.split("").slice(0, 8).join(""), 36) : 0;
        return tb - ta;
      });
    case "oldest":
      return sorted.sort((a, b) => {
        const ta = typeof a.id === "string" ? parseInt(a.id.split("").slice(0, 8).join(""), 36) : 0;
        const tb = typeof b.id === "string" ? parseInt(b.id.split("").slice(0, 8).join(""), 36) : 0;
        return ta - tb;
      });
    default:
      return sorted;
  }
}

export function npcColor(id) { return NPC_STATUSES.find(s => s.id === id)?.color || "#c2b896"; }

export const GM_CATEGORIES = [
  { id: "plan",    label: "Planung",   color: "#86bfa0", icon: "📋" },
  { id: "secret",  label: "Geheimnis", color: "#c99a2e", icon: "🔐" },
  { id: "npc",     label: "NPC-Info",  color: "#6fae86", icon: "👤" },
  { id: "world",   label: "Ort",       color: "#e3c46a", icon: "📍" },
  { id: "session", label: "Session",   color: "#d89a8e", icon: "🎬" },
];

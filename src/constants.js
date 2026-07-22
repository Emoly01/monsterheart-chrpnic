export function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
export function formatDate(ts) { return new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }); }

export const REACTIONS = ["✨","💀","😂","❤️","🎲","😱"];
export const DEFAULT_PIN = "1234";
export const QUEST_STATUSES = [
  { id: "offen",      label: "Offen",       color: "#c99a2e" },
  { id: "aktiv",      label: "Aktiv",       color: "#86bfa0" },
  { id: "gelöst",     label: "Gelöst",      color: "#6fae86" },
  { id: "gescheitert",label: "Gescheitert", color: "#d89a8e" },
];
export const NPC_STATUSES = [
  { id: "lebendig", label: "Lebendig", color: "#6fae86" },
  { id: "tot",      label: "Tot",      color: "#d89a8e" },
  { id: "vermisst", label: "Vermisst", color: "#e3c46a" },
  { id: "unbekannt",label: "Unbekannt",color: "#c2b896" },
];

export const PAKT_TYPES = [
  { id: "deal",         label: "Pakt/Deal",    color: "#d4a838", icon: "🤝" },
  { id: "versprechen",  label: "Versprechen",  color: "#86bfa0", icon: "🕊" },
  { id: "schuld",       label: "Schuld",       color: "#e3c46a", icon: "⚖" },
  { id: "prophezeiung", label: "Prophezeiung", color: "#c99a2e", icon: "🔮" },
  { id: "fluch",        label: "Fluch",        color: "#d89a8e", icon: "🥀" },
];
export const PAKT_STATUSES = [
  { id: "offen",     label: "Offen",     color: "#c99a2e" },
  { id: "eingeloest",label: "Eingelöst", color: "#6fae86" },
  { id: "gebrochen", label: "Gebrochen", color: "#d89a8e" },
  { id: "verfallen", label: "Verfallen", color: "#c2b896" },
];

export const NPC_LOCATIONS = [
  { id: "all",       label: "Alle",                  icon: "✦" },
  { id: "karnival",  label: "Witchlight Karnival",   icon: "🎪" },
  { id: "hither",    label: "Hither",                icon: "🌿" },
  { id: "tither",    label: "Tither",                icon: "🍄" },
  { id: "yon",       label: "Yon",                   icon: "🌙" },
  { id: "palast",    label: "Palast der Herzensbegierde", icon: "🏰" },
  { id: "unbekannt", label: "Unbekannt",              icon: "❓" },
];

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

export function qColor(id) { return QUEST_STATUSES.find(s => s.id === id)?.color || "#c2b896"; }
export function npcColor(id) { return NPC_STATUSES.find(s => s.id === id)?.color || "#c2b896"; }
export function paktType(id) { return PAKT_TYPES.find(t => t.id === id) || PAKT_TYPES[0]; }
export function paktStatus(id) { return PAKT_STATUSES.find(s => s.id === id) || PAKT_STATUSES[0]; }
export function sortPakte(arr) {
  return [...arr].sort((a, b) => {
    const ao = (a.status || "offen") === "offen" ? 0 : 1;
    const bo = (b.status || "offen") === "offen" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (b.ts || 0) - (a.ts || 0);
  });
}

export const THEORY_CATEGORIES = [
  { id: "plot",    label: "Plot-Theorie",   icon: "🔮", color: "#d4a838" },
  { id: "npc",     label: "NPC-Theorie",    icon: "👤", color: "#86bfa0" },
  { id: "ort",     label: "Ort / Geheimnis",icon: "🗝",  color: "#e3c46a" },
  { id: "wild",    label: "Wildes Gerücht", icon: "🌪", color: "#d89a8e" },
];
export const THEORY_REACTS = [
  { emoji: "👍", label: "Glaub ich auch" },
  { emoji: "👎", label: "Glaub ich nicht" },
  { emoji: "🤯", label: "Whoa" },
];

export const FUND_TYPES = [
  { id: "brief",    label: "Brief",     icon: "✉" },
  { id: "tagebuch", label: "Tagebuch",  icon: "📔" },
  { id: "notiz",    label: "Notiz",     icon: "📝" },
  { id: "artefakt", label: "Artefakt",  icon: "🏺" },
  { id: "karte",    label: "Karte",     icon: "🗺" },
  { id: "sonstiges",label: "Sonstiges", icon: "🔮" },
];

export const GM_CATEGORIES = [
  { id: "plan",    label: "Planung",   color: "#86bfa0", icon: "📋" },
  { id: "secret",  label: "Geheimnis", color: "#c99a2e", icon: "🔐" },
  { id: "npc",     label: "NPC-Info",  color: "#6fae86", icon: "👤" },
  { id: "world",   label: "Welt",      color: "#e3c46a", icon: "🌍" },
  { id: "session", label: "Session",   color: "#d89a8e", icon: "🎲" },
];

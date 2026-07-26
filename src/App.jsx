import { useState } from "react";
import { useSyncedList, useSyncedReactions } from "./sync.js";
import { DEFAULT_PIN } from "./constants.js";
import ChronikTab from "./tabs/ChronikTab.jsx";
import ZitateTab from "./tabs/ZitateTab.jsx";
import GeschichtenTab from "./tabs/GeschichtenTab.jsx";
import NpcsTab from "./tabs/NpcsTab.jsx";
import PlayerCharactersTab from "./tabs/PlayerCharactersTab.jsx";
import HausTab from "./tabs/HausTab.jsx";
import MoodboardTab from "./tabs/MoodboardTab.jsx";
import GmPlanTab from "./tabs/GmPlanTab.jsx";
import NotizenTab from "./tabs/NotizenTab.jsx";
import SchnellerfassungBar from "./SchnellerfassungBar.jsx";
import SpielerBar from "./SpielerBar.jsx";
import "./styles.css";

const S = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const TAB_ICONS = {
  chronik:    <svg {...S}><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M19 3v18"/><path d="M8 8h7"/></svg>,
  zitate:     <svg {...S}><path d="M9 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3l3-3V9a2 2 0 0 0-1-2z"/><path d="M20 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3l3-3V9a2 2 0 0 0-1-2z"/></svg>,
  geschichten:<svg {...S}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5"/><path d="M20 20L8.5 8.5"/></svg>,
  npcs:       <svg {...S}><path d="M3 11c0 4 2 6 4.5 6S11 15 11 12c0-2-1-4-4-4s-4 1-4 3z"/><path d="M13 12c0 3 1.5 5 3.5 5S21 15 21 11c0-2-1-3-4-3s-4 1-4 4z"/></svg>,
  pc:         <svg {...S}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>,
  moodboard:  <svg {...S}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>,
  notizen:    <svg {...S}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>,
  haus:       <svg {...S}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  gmplan:     <svg {...S}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
};

export default function TrinidadDiaries() {
  const [tab, setTab] = useState("chronik");
  const [gmMode, setGmMode] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [playerName, setPlayerName] = useState(() => { try { return localStorage.getItem("td-player-name") || ""; } catch { return ""; } });
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // ── Live-synced shared data (one Firestore doc per item, see sync.js) ──
  const [recaps, ur, recapsReady] = useSyncedList("td-s-recaps");
  const [quotes, uqt, quotesReady] = useSyncedList("td-s-quotes");
  const [snippets, usn, snippetsReady] = useSyncedList("td-s-snippets");
  const [npcs, un, npcsReady] = useSyncedList("td-s-npcs");
  const [pcs, upc, pcsReady] = useSyncedList("td-s-pcs", { order: "asc" });
  const [reactions, react, reactionsReady] = useSyncedReactions("td-s-reactions");
  const [gmNotes, ugn, gmNotesReady] = useSyncedList("td-s-gmnotes");
  const [pcDossiers, upd, pcDossiersReady] = useSyncedList("td-s-pcdossiers", { order: "asc" });
  const [worldEntries, uwe, worldEntriesReady] = useSyncedList("td-s-worldentries");
  const [quickNotes, uqn, quickNotesReady] = useSyncedList("td-s-quicknotes");
  const [playerNotes, upn, playerNotesReady] = useSyncedList("td-s-playernotes");
  const [haus, uh, hausReady] = useSyncedList("td-s-haus");
  const [moodboard, umb, moodboardReady] = useSyncedList("td-s-moodboard");
  const loaded = recapsReady && quotesReady
    && snippetsReady && npcsReady && pcsReady && reactionsReady
    && gmNotesReady && pcDossiersReady && worldEntriesReady
    && quickNotesReady && playerNotesReady && hausReady && moodboardReady;

  const pin = () => { try { return localStorage.getItem("td-gm-pin") || DEFAULT_PIN; } catch { return DEFAULT_PIN; } };
  const tryPin = () => {
    if (pinInput === pin()) { setGmMode(true); setShowPin(false); setPinInput(""); setPinError(false); }
    else { setPinError(true); }
  };
  const saveName = () => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    try { localStorage.setItem("td-player-name", nameInput.trim()); } catch {}
    setShowNamePrompt(false); setNameInput("");
  };
  const needName = () => { setShowNamePrompt(true); setNameInput(playerName); };

  const tabs = [
    { id: "chronik",    icon: "📖", label: "Diary" },
    { id: "zitate",     icon: "❝",  label: "Zitate" },
    { id: "geschichten",icon: "🌙",  label: "Snippets" },
    { id: "npcs",       icon: "👥",  label: "NPCs" },
    { id: "pc",         icon: "🎭",  label: "Player Character's" },
    { id: "moodboard",  icon: "🖼",  label: "Moodboard" },
    { id: "notizen",    icon: "📝", label: "Notizen" },
    ...(gmMode ? [{ id: "haus", icon: "🏡", label: "Haus" }] : []),
    ...(gmMode ? [{ id: "gmplan", icon: "🔐", label: "GM-Plan" }] : []),
  ];

  const appBg = "radial-gradient(1200px 620px at 84% -10%, rgba(234,176,51,0.12), transparent 60%), radial-gradient(1000px 560px at -6% 106%, rgba(38,179,154,0.10), transparent 55%), radial-gradient(900px 900px at 50% 40%, rgba(229,52,42,0.045), transparent 70%), #0f1613";

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: appBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa89c", fontFamily: "'Spectral', Georgia, serif", fontStyle: "italic", fontSize: "1.1rem", letterSpacing: "0.06em" }}>
      lädt …
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: appBg, color: "#f4ead6", fontFamily: "'Spectral', Georgia, serif" }}>
      {/* PIN overlay */}
      {showPin && (
        <div className="overlay" onClick={() => { setShowPin(false); setPinInput(""); setPinError(false); }}>
          <div className="pin-box" onClick={e => e.stopPropagation()}>
            <p className="pin-title">✨ GM Modus</p>
            <p className="pin-sub">Bitte gib deine PIN ein</p>
            <input className={`pin-input ${pinError ? "error" : ""}`} type="password" maxLength={8}
              value={pinInput} onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === "Enter" && tryPin()} autoFocus placeholder="••••" />
            {pinError && <p className="pin-error">Falsche PIN. Versuch's nochmal ✦</p>}
            <div className="pin-actions">
              <button className="btn-primary" onClick={tryPin}>Einloggen</button>
              <button className="btn-secondary" onClick={() => { setShowPin(false); setPinInput(""); setPinError(false); }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="overlay" onClick={() => setShowNamePrompt(false)}>
          <div className="name-box" onClick={e => e.stopPropagation()}>
            <p className="name-title">Wer bist du?</p>
            <p className="name-sub">Gib deinen Charakternamen ein</p>
            <input className="f-input" style={{ marginBottom: "0.8rem", textAlign: "center" }}
              value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()} placeholder="z.B. Eya" autoFocus />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button className="btn-primary" onClick={saveName}>Speichern</button>
              <button className="btn-secondary" onClick={() => setShowNamePrompt(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="hdr">
        <div className="hdr-top">
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 40 40" width="44" height="44" style={{ display: "block" }}>
                <defs><clipPath id="rnd"><circle cx="20" cy="20" r="19" /></clipPath></defs>
                <circle cx="20" cy="20" r="19" fill="#e5342a" />
                <g clipPath="url(#rnd)">
                  <path d="M4 30 L30 4" stroke="#fbf6ec" strokeWidth="10" />
                  <path d="M4 30 L30 4" stroke="#12100e" strokeWidth="6" />
                </g>
                <circle cx="20" cy="20" r="13" fill="none" stroke="rgba(251,246,236,.35)" strokeWidth="1" />
                <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(251,246,236,.22)" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <p className="campaign-name">The Trinidad Diaries</p>
              <p className="campaign-sub">Kampagnen-Chronik&ensp;<span className="campaign-sub-star">✦</span>&ensp;Gemeinsame Erinnerungen</p>
            </div>
          </div>
          <div className="hdr-right">
            {gmMode
              ? <span className="gm-badge active" onClick={() => setGmMode(false)}>◆ GM Modus aktiv</span>
              : <span className="gm-badge inactive" onClick={() => setShowPin(true)}>SL einloggen</span>
            }
            <span className="player-chip" onClick={needName}>
              {playerName ? <><span className="player-chip-diamond">◆</span>&nbsp; {playerName}</> : "Namen eingeben"}
            </span>
          </div>
        </div>
        <nav className="tab-row">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""} ${t.id === "gmplan" ? "gm-tab" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{TAB_ICONS[t.id]}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="tricolor-line" />
      </header>

      {/* Tabs stay mounted while hidden so form drafts survive tab switches. */}
      <div hidden={tab !== "chronik"}>
        <ChronikTab gmMode={gmMode} playerName={playerName} needName={needName} recaps={recaps} ur={ur} reactions={reactions} react={react} pcs={pcs} quotes={quotes} />
      </div>
      <div hidden={tab !== "zitate"}>
        <ZitateTab gmMode={gmMode} playerName={playerName} quotes={quotes} uqt={uqt} />
      </div>
      <div hidden={tab !== "geschichten"}>
        <GeschichtenTab gmMode={gmMode} playerName={playerName} snippets={snippets} usn={usn} />
      </div>
      <div hidden={tab !== "npcs"}>
        <NpcsTab gmMode={gmMode} playerName={playerName} npcs={npcs} un={un} pcs={pcs} upc={upc} />
      </div>
      <div hidden={tab !== "pc"}>
        <PlayerCharactersTab gmMode={gmMode} playerName={playerName} needName={needName} pcs={pcs} upc={upc} />
      </div>
      <div hidden={tab !== "moodboard"}>
        <MoodboardTab gmMode={gmMode} playerName={playerName} needName={needName} moodboard={moodboard} umb={umb} />
      </div>
      <div hidden={tab !== "notizen"}>
        <NotizenTab playerName={playerName} needName={needName} playerNotes={playerNotes} upn={upn} />
      </div>
      <div hidden={tab !== "haus" || !gmMode}>
        <HausTab gmMode={gmMode} playerName={playerName} needName={needName} haus={haus} uh={uh} />
      </div>
      <div hidden={tab !== "gmplan" || !gmMode}>
        <GmPlanTab pcDossiers={pcDossiers} upd={upd} worldEntries={worldEntries} uwe={uwe}
          quickNotes={quickNotes} uqn={uqn} gmNotes={gmNotes} ugn={ugn} />
      </div>

      {/* One bar at a time: the GM keeps theirs, everyone else gets the
          foldable player version. */}
      <div hidden={!gmMode}>
        <SchnellerfassungBar quotes={quotes} uqt={uqt} quickNotes={quickNotes} uqn={uqn} />
      </div>
      <div hidden={gmMode}>
        <SpielerBar playerName={playerName} needName={needName} quotes={quotes} uqt={uqt} playerNotes={playerNotes} upn={upn} />
      </div>
    </div>
  );
}

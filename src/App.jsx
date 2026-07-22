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
import SchnellerfassungBar from "./SchnellerfassungBar.jsx";
import "./styles.css";

export default function WitchlightChronik() {
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
  const [haus, uh, hausReady] = useSyncedList("td-s-haus");
  const [moodboard, umb, moodboardReady] = useSyncedList("td-s-moodboard");
  const loaded = recapsReady && quotesReady
    && snippetsReady && npcsReady && pcsReady && reactionsReady
    && gmNotesReady && pcDossiersReady && worldEntriesReady
    && quickNotesReady && hausReady && moodboardReady;

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
    ...(gmMode ? [{ id: "haus", icon: "🏡", label: "Haus" }] : []),
    ...(gmMode ? [{ id: "gmplan", icon: "🔐", label: "GM-Plan" }] : []),
  ];

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 30%, rgba(227,196,106,0.14) 0%, transparent 55%), #fbf4e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#c99a2e", fontFamily: "serif", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
      🌺 lädt...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, #fde7d3 0%, transparent 55%), linear-gradient(178deg, #fde3cb 0%, #fbdcbb 45%, #f8d3ad 100%)", color: "#2c2117", fontFamily: "'IM Fell English', Georgia, serif", fontSize: "110%" }}>
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
      <div className="hdr">
        <div className="hdr-top">
          <div>
            <p className="campaign-name">The Trinidad Diaries <span className="campaign-flower">🌺</span></p>
            <p className="campaign-sub">Kampagnen-Chronik ✦ Gemeinsame Erinnerungen</p>
          </div>
          <div className="hdr-right">
            {gmMode
              ? <span className="gm-badge active" onClick={() => setGmMode(false)}>✦ GM Modus aktiv</span>
              : <span className="gm-badge inactive" onClick={() => setShowPin(true)}>SL einloggen</span>
            }
            <span className="player-chip" onClick={needName}>{playerName ? `✦ ${playerName}` : "Namen eingeben"}</span>
          </div>
        </div>
        <div className="tab-row">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""} ${t.id === "gmplan" ? "gm-tab" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs stay mounted while hidden so form drafts survive tab switches. */}
      <div hidden={tab !== "chronik"}>
        <ChronikTab gmMode={gmMode} recaps={recaps} ur={ur} reactions={reactions} react={react} />
      </div>
      <div hidden={tab !== "zitate"}>
        <ZitateTab gmMode={gmMode} playerName={playerName} quotes={quotes} uqt={uqt} />
      </div>
      <div hidden={tab !== "geschichten"}>
        <GeschichtenTab gmMode={gmMode} playerName={playerName} snippets={snippets} usn={usn} />
      </div>
      <div hidden={tab !== "npcs"}>
        <NpcsTab gmMode={gmMode} playerName={playerName} npcs={npcs} un={un} />
      </div>
      <div hidden={tab !== "pc"}>
        <PlayerCharactersTab gmMode={gmMode} playerName={playerName} needName={needName} pcs={pcs} upc={upc} />
      </div>
      <div hidden={tab !== "moodboard"}>
        <MoodboardTab gmMode={gmMode} playerName={playerName} needName={needName} moodboard={moodboard} umb={umb} />
      </div>
      <div hidden={tab !== "haus" || !gmMode}>
        <HausTab gmMode={gmMode} playerName={playerName} needName={needName} haus={haus} uh={uh} />
      </div>
      <div hidden={tab !== "gmplan" || !gmMode}>
        <GmPlanTab pcDossiers={pcDossiers} upd={upd} worldEntries={worldEntries} uwe={uwe}
          quickNotes={quickNotes} uqn={uqn} gmNotes={gmNotes} ugn={ugn} />
      </div>

      <div hidden={!gmMode}>
        <SchnellerfassungBar quotes={quotes} uqt={uqt} quickNotes={quickNotes} uqn={uqn} />
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { makeId } from "./constants.js";

// The players' counterpart to the GM's Schnellerfassung: quotes land in the
// shared Zitate tab, notes go to the players' own Notizen tab (never into the
// GM's quick notes). Unlike the GM bar it can be folded away — it sits over the
// page, and not everyone wants it open all session.
export default function SpielerBar({ playerName, needName, quotes, uqt, playerNotes, upn }) {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem("td-pl-bar") === "1"; } catch { return false; } });
  const [mode, setMode] = useState("notiz"); // "zitat" | "notiz"
  const [sitzung, setSitzung] = useState(() => { try { return localStorage.getItem("td-se-sitzung") || ""; } catch { return ""; } });
  const [speaker, setSpeaker] = useState("");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const textRef = useRef(null);

  const toggleOpen = (next) => {
    setOpen(next);
    try { localStorage.setItem("td-pl-bar", next ? "1" : "0"); } catch {}
    if (next) setTimeout(() => textRef.current?.focus(), 0);
  };

  const save = () => {
    if (!text.trim()) return;
    if (!playerName) { needName(); return; }
    // Read straight from localStorage so a date picked moments ago is used even
    // if its state update hasn't re-rendered yet.
    const session = (() => { try { return localStorage.getItem("td-se-sitzung") || sitzung; } catch { return sitzung; } })();
    if (mode === "zitat") {
      uqt([{ id: makeId(), speaker: speaker.trim() || playerName, text: text.trim(), ts: Date.now(), sitzung: session }, ...quotes]);
    } else {
      upn([{ id: makeId(), text: text.trim(), tag: "", done: false, author: playerName, ts: Date.now(), sitzung: session }, ...playerNotes]);
    }
    setSpeaker("");
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    setTimeout(() => textRef.current?.focus(), 0);
  };

  if (!open) return (
    <button className="pl-bar-fab" onClick={() => toggleOpen(true)} title="Schnellerfassung öffnen">
      ✦ Schnellerfassung
    </button>
  );

  return (
    <>
      <div className="se-bar se-bar-player">
        <div className="se-bar-top">
          <span className="se-date-label">Aktuelle Sitzung</span>
          <input
            type="date"
            className="se-date-input"
            value={sitzung}
            onChange={e => { setSitzung(e.target.value); try { localStorage.setItem("td-se-sitzung", e.target.value); } catch {} }}
          />
          {saved && <span className="pl-bar-saved">✓ Gespeichert</span>}
          <div className="se-toggle">
            <button className={`se-toggle-btn${mode === "zitat" ? " active" : ""}`} onClick={() => setMode("zitat")}>Zitat</button>
            <button className={`se-toggle-btn${mode === "notiz" ? " active" : ""}`} onClick={() => setMode("notiz")}>Notiz</button>
          </div>
          <button className="pl-bar-close" onClick={() => toggleOpen(false)} title="Schnellerfassung schließen">✕</button>
        </div>
        <div className="se-row">
          {mode === "zitat" && (
            <input
              type="text"
              className="se-input se-input-speaker"
              placeholder="Wer?"
              value={speaker}
              onChange={e => setSpeaker(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") textRef.current?.focus(); }}
            />
          )}
          <input
            ref={textRef}
            type="text"
            className="se-input"
            placeholder={mode === "zitat" ? "Was wurde gesagt?" : "Notiz — landet in deinem Notizen-Tab…"}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); }}
          />
          <button className="se-save-btn" onClick={save}>Speichern</button>
        </div>
        {!playerName && <p className="pl-bar-hint">Gib oben rechts deinen Namen ein, damit deine Einträge dir zugeordnet werden.</p>}
      </div>
      {/* Keeps the fixed bar from covering the end of the page. */}
      <div className="pl-bar-spacer" />
    </>
  );
}

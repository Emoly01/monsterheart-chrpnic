import { useState, useRef } from "react";
import { makeId } from "./constants.js";

export default function SchnellerfassungBar({ quotes, uqt, quickNotes, uqn }) {
  const [seMode, setSeMode] = useState("zitat"); // "zitat" | "notiz"
  const [seSitzung, setSeSitzung] = useState(() => { try { return localStorage.getItem("td-se-sitzung") || ""; } catch { return ""; } });
  const [seSpeaker, setSeSpeaker] = useState("");
  const [seText, setSeText] = useState("");
  const seTextRef = useRef(null);

  const saveSe = () => {
    if (!seText.trim()) return;
    // Read from localStorage directly so we always have the latest value even if
    // the React state update from the date picker hasn't re-rendered yet.
    const sitzung = (() => { try { return localStorage.getItem("td-se-sitzung") || seSitzung; } catch { return seSitzung; } })();
    if (seMode === "zitat") {
      uqt([{ id: makeId(), speaker: seSpeaker.trim(), text: seText.trim(), ts: Date.now(), sitzung }, ...quotes]);
    } else {
      uqn([{ id: makeId(), text: seText.trim(), tag: "", done: false, ts: Date.now(), sitzung }, ...quickNotes]);
    }
    setSeSpeaker("");
    setSeText("");
    setTimeout(() => seTextRef.current?.focus(), 0);
  };

  return (
    <div className="se-bar">
      <div className="se-bar-top">
        <span className="se-date-label">Aktuelle Sitzung</span>
        <input
          type="date"
          className="se-date-input"
          value={seSitzung}
          onChange={e => { setSeSitzung(e.target.value); try { localStorage.setItem("td-se-sitzung", e.target.value); } catch {} }}
        />
        <div className="se-toggle">
          <button className={`se-toggle-btn${seMode === "zitat" ? " active" : ""}`} onClick={() => setSeMode("zitat")}>Zitat</button>
          <button className={`se-toggle-btn${seMode === "notiz" ? " active" : ""}`} onClick={() => setSeMode("notiz")}>Notiz</button>
        </div>
      </div>
      <div className="se-row">
        {seMode === "zitat" && (
          <input
            type="text"
            className="se-input se-input-speaker"
            placeholder="Wer?"
            value={seSpeaker}
            onChange={e => setSeSpeaker(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") seTextRef.current?.focus(); }}
          />
        )}
        <input
          ref={seTextRef}
          type="text"
          className="se-input"
          placeholder={seMode === "zitat" ? "Was wurde gesagt?" : "Notiz…"}
          value={seText}
          onChange={e => setSeText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") saveSe(); }}
        />
        <button className="se-save-btn" onClick={saveSe}>Speichern</button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { makeId, formatDate } from "../constants.js";

// The players' notebook — separate from the GM's quick notes, which stay behind
// the PIN. Notes are shared at the table (there is no per-player login), so each
// one carries its author and can be filtered down to just your own.
export default function NotizenTab({ playerName, needName, playerNotes, upn }) {
  const [form, setForm] = useState({ text: "", tag: "" });
  const [editingId, setEditingId] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const addNote = () => {
    if (!form.text.trim()) return;
    if (!playerName) { needName(); return; }
    if (editingId) {
      upn(playerNotes.map(n => n.id === editingId ? { ...n, text: form.text.trim(), tag: form.tag.trim() } : n));
      setEditingId(null);
    } else {
      upn([{ id: makeId(), text: form.text.trim(), tag: form.tag.trim(), done: false, author: playerName, ts: Date.now() }, ...playerNotes]);
    }
    setForm({ text: "", tag: "" });
  };

  const toggleDone = (id) => upn(playerNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  const removeNote = (id) => {
    upn(playerNotes.filter(n => n.id !== id));
    if (editingId === id) { setEditingId(null); setForm({ text: "", tag: "" }); }
  };

  const visible = onlyMine ? playerNotes.filter(n => n.author === playerName) : playerNotes;
  const open = visible.filter(n => !n.done);
  const done = visible.filter(n => n.done);

  const noteCard = (n) => (
    <div key={n.id} className={`qn-card${n.done ? " done" : ""}`}>
      <div className={`qn-checkbox${n.done ? " checked" : ""}`} onClick={() => toggleDone(n.id)}>{n.done ? "✓" : " "}</div>
      <div style={{ flex: 1 }}>
        <p className="qn-text">{n.text}</p>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.2rem", flexWrap: "wrap" }}>
          {n.tag && <span className="qn-tag">{n.tag}</span>}
          {n.author && <span className="qn-author">— {n.author}</span>}
          <span className="qn-date">{formatDate(n.ts)}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.2rem", flexShrink: 0 }}>
        <button className="card-act-edit" title="Bearbeiten"
          onClick={() => { setForm({ text: n.text, tag: n.tag || "" }); setEditingId(n.id); }}>✎</button>
        <button className="btn-danger" title="Löschen" onClick={() => removeNote(n.id)}>✕</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="section-hdr">
        <div className="section-head">
          <div className="eyebrow">Kampagne · Iere</div>
          <h1 className="section-title">Notizen</h1>
          <p className="section-sub">Was ihr euch merken wollt — Hinweise, Fragen, lose Fäden.</p>
        </div>
        {playerNotes.length > 0 && (
          <button className={`btn-add${onlyMine ? " active" : ""}`} onClick={() => setOnlyMine(v => !v)}>
            {onlyMine ? "Alle anzeigen" : "✦ Nur meine"}
          </button>
        )}
      </div>

      <div className="form-panel">
        <p className="form-title">{editingId ? "Notiz bearbeiten" : "📝 Schnelle Notiz"}</p>
        <div className="qn-input-row">
          <input className="f-input" value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addNote()}
            placeholder="Was willst du nicht vergessen?" />
          <input className="f-input" style={{ maxWidth: "120px" }} value={form.tag}
            onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addNote()}
            placeholder="Tag (opt.)" />
          <button className="btn-primary" onClick={addNote} disabled={!form.text.trim()} style={{ whiteSpace: "nowrap" }}>{editingId ? "✓" : "+"}</button>
          {editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm({ text: "", tag: "" }); }} style={{ whiteSpace: "nowrap" }}>✕</button>}
        </div>
      </div>

      {visible.length === 0
        ? <div className="empty">
            {onlyMine ? "Du hast noch nichts notiert." : "Noch keine Notizen."}<br />
            <span style={{ fontSize: "0.85rem" }}>Schnell was notieren, erledigt abhaken. 📝</span>
          </div>
        : <>
          {open.length > 0 && <div style={{ marginBottom: "1rem" }}>{open.map(noteCard)}</div>}
          {done.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "0.45rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9aa89c", marginBottom: "0.4rem" }}>
                ✓ Erledigt ({done.length})
              </p>
              {done.map(noteCard)}
            </div>
          )}
        </>
      }
    </div>
  );
}

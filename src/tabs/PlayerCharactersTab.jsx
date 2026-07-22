import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId, formatDate } from "../constants.js";

// Player Character roster. Players (once they've set a name) can add their own
// character; the author or the GM can edit or delete it. Everyone can read.
export default function PlayerCharactersTab({ gmMode, playerName, needName, pcs, upc }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", player: "", concept: "", image: "", description: "" });
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const canWrite = gmMode || !!playerName;
  const canEdit = (pc) => gmMode || (pc.owner && pc.owner === playerName);

  const blank = () => setForm({ name: "", player: "", concept: "", image: "", description: "" });

  const startAdd = () => {
    if (!canWrite) { needName(); return; }
    setEditingId(null);
    setForm({ name: "", player: playerName || "", concept: "", image: "", description: "" });
    setShowForm(true);
  };

  const startEdit = (pc) => {
    setEditingId(pc.id);
    setForm({ name: pc.name || "", player: pc.player || "", concept: pc.concept || "", image: pc.image || "", description: pc.description || "" });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      player: form.player.trim(),
      concept: form.concept.trim(),
      image: form.image.trim(),
      description: form.description,
    };
    if (editingId) {
      upc(pcs.map(p => p.id === editingId ? { ...p, ...data } : p));
    } else {
      upc([...pcs, { id: makeId(), ...data, owner: playerName || "GM", ts: Date.now() }]);
    }
    blank();
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (pc) => {
    if (window.confirm(`${pc.name} wirklich löschen?`)) {
      upc(pcs.filter(p => p.id !== pc.id));
      if (expanded === pc.id) setExpanded(null);
    }
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🎭 Player Character's</p>
        <button className="btn-add" onClick={startAdd}>+ Charakter</button>
      </div>

      {showForm && (
        <div className="form-panel">
          <p className="form-title">{editingId ? "Charakter bearbeiten" : "Neuer Charakter"}</p>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Spieler:in</label>
              <input className="f-input" value={form.player} onChange={e => setForm(f => ({ ...f, player: e.target.value }))} placeholder="Dein Name" /></div>
            <div className="f-group"><label className="f-label">Charaktername</label>
              <input className="f-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Eya" autoFocus /></div>
          </div>
          <div className="f-group"><label className="f-label">Konzept</label>
            <input className="f-input" value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} placeholder="z.B. Die geflohene Priesterin" /></div>
          <div className="f-group"><label className="f-label">Bild-URL (opt.)</label>
            <input className="f-input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="i.imgur.com/..." /></div>
          <div className="f-group"><label className="f-label">Beschreibung</label>
            <RichEditor value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Wer ist dieser Charakter? Geschichte, Persönlichkeit, Ziele..." rows={4} /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={save} disabled={!form.name.trim()}>Speichern</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); blank(); }}>Abbrechen</button>
          </div>
        </div>
      )}

      {pcs.length === 0 && !showForm && (
        <div className="empty">
          Noch keine Charaktere.<br />
          {canWrite ? "Lege deinen Charakter an ✦" : "Gib oben deinen Namen ein, um deinen Charakter anzulegen ✦"}
        </div>
      )}

      <div className="npc-grid">
        {pcs.map(pc => (
          <div key={pc.id} className={`npc-card ${expanded === pc.id ? "selected" : ""}`}
            onClick={() => setExpanded(expanded === pc.id ? null : pc.id)}>
            <div className="npc-img">
              {pc.image
                ? <img src={pc.image} alt={pc.name} onError={e => { e.target.style.display = "none"; }} />
                : "🎭"}
            </div>
            <div className="npc-card-body">
              <p className="npc-card-name">{pc.name}</p>
              {pc.concept && <p className="npc-card-faction">{pc.concept}</p>}
              {pc.player && <p className="card-meta" style={{ marginTop: "0.25rem" }}>✦ {pc.player}</p>}
            </div>
          </div>
        ))}
      </div>

      {expanded && (() => {
        const pc = pcs.find(p => p.id === expanded);
        if (!pc) return null;
        return (
          <div className="npc-detail" style={{ marginTop: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", marginBottom: "0.4rem" }}>
              <div style={{ flex: 1 }}>
                <p className="npc-detail-name">{pc.name}</p>
                {pc.concept && <p className="npc-detail-faction">{pc.concept}</p>}
                {pc.player && <p className="card-meta">Gespielt von {pc.player}</p>}
              </div>
              {canEdit(pc) && <button className="card-act-edit" onClick={() => startEdit(pc)}>✎</button>}
              {canEdit(pc) && <button className="btn-danger" title="Löschen" onClick={() => remove(pc)}>✕</button>}
              <button className="btn-danger" title="Schließen" onClick={() => setExpanded(null)}>✕</button>
            </div>
            {pc.image && <img className="npc-detail-img" src={pc.image} alt={pc.name} onError={e => { e.target.style.display = "none"; }} />}
            {pc.description
              ? <div className="narrative" dangerouslySetInnerHTML={{ __html: pc.description }} />
              : <p style={{ fontFamily: "'IM Fell English',serif", fontStyle: "italic", color: "#c0ad82", fontSize: "0.9rem", margin: 0 }}>Noch keine Beschreibung.</p>}
            <p className="card-meta" style={{ marginTop: "0.8rem" }}>Angelegt {formatDate(pc.ts)}</p>
          </div>
        );
      })()}
    </div>
  );
}

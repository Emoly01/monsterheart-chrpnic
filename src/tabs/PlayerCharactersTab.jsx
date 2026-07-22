import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId, formatDate } from "../constants.js";

const emptyNpcDraft = { name: "", image: "", description: "" };

// Player Character roster. Players (once they've set a name) can add their own
// character with a backstory and a list of important NPCs; the author or the GM
// can edit or delete it. Everyone can read.
export default function PlayerCharactersTab({ gmMode, playerName, needName, pcs, upc }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", player: "", concept: "", image: "", backstory: "" });
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  // Per-character "important NPC" draft + which NPC (if any) is being edited.
  const [npcDraft, setNpcDraft] = useState({});
  const [editingNpc, setEditingNpc] = useState(null);

  const canWrite = gmMode || !!playerName;
  const canEdit = (pc) => gmMode || (pc.owner && pc.owner === playerName);

  const blank = () => setForm({ name: "", player: "", concept: "", image: "", backstory: "" });

  const startAdd = () => {
    if (!canWrite) { needName(); return; }
    setEditingId(null);
    setForm({ name: "", player: playerName || "", concept: "", image: "", backstory: "" });
    setShowForm(true);
  };

  const startEdit = (pc) => {
    setEditingId(pc.id);
    setForm({ name: pc.name || "", player: pc.player || "", concept: pc.concept || "", image: pc.image || "", backstory: pc.backstory || "" });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      player: form.player.trim(),
      concept: form.concept.trim(),
      image: form.image.trim(),
      backstory: form.backstory,
    };
    if (editingId) {
      upc(pcs.map(p => p.id === editingId ? { ...p, ...data } : p));
    } else {
      upc([...pcs, { id: makeId(), ...data, npcs: [], owner: playerName || "GM", ts: Date.now() }]);
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

  // ── Important NPCs (nested per character) ──
  const getDraft = (pcId) => npcDraft[pcId] || emptyNpcDraft;
  const setDraft = (pcId, patch) => setNpcDraft(s => ({ ...s, [pcId]: { ...getDraft(pcId), ...patch } }));

  const saveNpc = (pc) => {
    const d = getDraft(pc.id);
    if (!d.name.trim()) return;
    const entry = { name: d.name.trim(), image: d.image.trim(), description: d.description.trim() };
    const list = pc.npcs || [];
    const nextNpcs = editingNpc
      ? list.map(n => n.id === editingNpc ? { ...n, ...entry } : n)
      : [...list, { id: makeId(), ...entry }];
    upc(pcs.map(p => p.id === pc.id ? { ...p, npcs: nextNpcs } : p));
    setNpcDraft(s => ({ ...s, [pc.id]: emptyNpcDraft }));
    setEditingNpc(null);
  };

  const editNpc = (pc, npc) => {
    setEditingNpc(npc.id);
    setDraft(pc.id, { name: npc.name || "", image: npc.image || "", description: npc.description || "" });
  };

  const cancelNpc = (pcId) => {
    setNpcDraft(s => ({ ...s, [pcId]: emptyNpcDraft }));
    setEditingNpc(null);
  };

  const removeNpc = (pc, npcId) => {
    if (window.confirm("NPC löschen?")) {
      upc(pcs.map(p => p.id === pc.id ? { ...p, npcs: (p.npcs || []).filter(n => n.id !== npcId) } : p));
      if (editingNpc === npcId) cancelNpc(pc.id);
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
          <div className="f-group"><label className="f-label">Hintergrundgeschichte</label>
            <RichEditor value={form.backstory} onChange={v => setForm(f => ({ ...f, backstory: v }))} placeholder="Woher kommt dein Charakter? Was hat ihn geprägt? Ziele, Geheimnisse..." rows={5} /></div>
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
        const npcs = pc.npcs || [];
        const draft = getDraft(pc.id);
        const editable = canEdit(pc);
        return (
          <div className="npc-detail" style={{ marginTop: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", marginBottom: "0.4rem" }}>
              <div style={{ flex: 1 }}>
                <p className="npc-detail-name">{pc.name}</p>
                {pc.concept && <p className="npc-detail-faction">{pc.concept}</p>}
                {pc.player && <p className="card-meta">Gespielt von {pc.player}</p>}
              </div>
              {editable && <button className="card-act-edit" onClick={() => startEdit(pc)}>✎</button>}
              {editable && <button className="btn-danger" title="Löschen" onClick={() => remove(pc)}>✕</button>}
              <button className="btn-danger" title="Schließen" onClick={() => setExpanded(null)}>✕</button>
            </div>
            {pc.image && <img className="npc-detail-img" src={pc.image} alt={pc.name} onError={e => { e.target.style.display = "none"; }} />}

            {/* Backstory */}
            <div className="divider" />
            <p className="pc-sub-label">📖 Hintergrundgeschichte</p>
            {pc.backstory
              ? <div className="narrative" dangerouslySetInnerHTML={{ __html: pc.backstory }} />
              : <p style={{ fontFamily: "'IM Fell English',serif", fontStyle: "italic", color: "#c0ad82", fontSize: "0.9rem", margin: 0 }}>
                  Noch keine Hintergrundgeschichte.{editable ? " Tippe auf ✎ oben, um sie zu schreiben." : ""}
                </p>}

            {/* Important NPCs */}
            <div className="divider" />
            <p className="pc-sub-label">👥 Wichtige NPCs{npcs.length > 0 ? ` · ${npcs.length}` : ""}</p>
            {npcs.length > 0 && (
              <div className="npc-grid" style={{ marginBottom: editable ? "0.9rem" : 0 }}>
                {npcs.map(npc => (
                  <div key={npc.id} className="npc-card" style={{ cursor: "default" }}>
                    <div className="npc-img">
                      {npc.image
                        ? <img src={npc.image} alt={npc.name} onError={e => { e.target.style.display = "none"; }} />
                        : "👤"}
                    </div>
                    <div className="npc-card-body">
                      <p className="npc-card-name">{npc.name}</p>
                      {npc.description && <p className="npc-card-faction" style={{ whiteSpace: "pre-wrap" }}>{npc.description}</p>}
                      {editable && (
                        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                          <button className="btn-tiny btn-tiny-secondary" onClick={() => editNpc(pc, npc)}>Bearbeiten</button>
                          <button className="btn-tiny btn-tiny-secondary" style={{ color: "#c0392b", borderColor: "#e6c3ba" }} onClick={() => removeNpc(pc, npc.id)}>Löschen</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {npcs.length === 0 && !editable && (
              <p style={{ fontFamily: "'IM Fell English',serif", fontStyle: "italic", color: "#c0ad82", fontSize: "0.9rem", margin: 0 }}>Noch keine NPCs.</p>
            )}

            {editable && (
              <div className="form-panel" style={{ marginBottom: 0 }}>
                <p className="form-title">{editingNpc ? "NPC bearbeiten" : "NPC hinzufügen"}</p>
                <div className="f-row">
                  <div className="f-group"><label className="f-label">Bild-URL (opt.)</label>
                    <input className="f-input" value={draft.image} onChange={e => setDraft(pc.id, { image: e.target.value })} placeholder="i.imgur.com/..." /></div>
                  <div className="f-group"><label className="f-label">Name</label>
                    <input className="f-input" value={draft.name} onChange={e => setDraft(pc.id, { name: e.target.value })} placeholder="z.B. Mama Laveaux" /></div>
                </div>
                <div className="f-group"><label className="f-label">Beschreibung</label>
                  <textarea className="f-input" rows={3} value={draft.description} onChange={e => setDraft(pc.id, { description: e.target.value })}
                    placeholder="Wer ist diese Person für deinen Charakter? Beziehung, Rolle, Wichtiges..." style={{ resize: "vertical", fontFamily: "'IM Fell English', serif" }} /></div>
                <div className="f-actions">
                  <button className="btn-primary" onClick={() => saveNpc(pc)} disabled={!draft.name.trim()}>{editingNpc ? "Speichern" : "+ NPC"}</button>
                  {(editingNpc || draft.name || draft.image || draft.description) &&
                    <button className="btn-secondary" onClick={() => cancelNpc(pc.id)}>Abbrechen</button>}
                </div>
              </div>
            )}

            <p className="card-meta" style={{ marginTop: "0.8rem" }}>Angelegt {formatDate(pc.ts)}</p>
          </div>
        );
      })()}
    </div>
  );
}

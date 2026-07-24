import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId, formatDate } from "../constants.js";

const emptyNpcDraft = { name: "", image: "", description: "" };
const blankForm = () => ({ name: "", player: "", concept: "", image: "", backstory: "", npcs: [] });
const HUES = ["#ffb400", "#12e0b6", "#ff2b1c"];

// Player Character roster. Players (once they've set a name) can add their own
// character — including a backstory and a list of important NPCs, all in one
// form. The author or the GM can edit or delete it. Everyone can read.
export default function PlayerCharactersTab({ gmMode, playerName, needName, pcs, upc }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  // NPC being composed inside the character form.
  const [npcDraft, setNpcDraft] = useState(emptyNpcDraft);
  const [editingNpc, setEditingNpc] = useState(null);

  const canWrite = gmMode || !!playerName;
  const canEdit = (pc) => gmMode || (pc.owner && pc.owner === playerName);

  const resetForm = () => { setForm(blankForm()); setNpcDraft(emptyNpcDraft); setEditingNpc(null); };

  const startAdd = () => {
    if (!canWrite) { needName(); return; }
    setEditingId(null);
    setForm({ ...blankForm(), player: playerName || "" });
    setNpcDraft(emptyNpcDraft); setEditingNpc(null);
    setShowForm(true);
  };

  const startEdit = (pc) => {
    setEditingId(pc.id);
    setForm({ name: pc.name || "", player: pc.player || "", concept: pc.concept || "", image: pc.image || "", backstory: pc.backstory || "", npcs: pc.npcs || [] });
    setNpcDraft(emptyNpcDraft); setEditingNpc(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm(); };

  const save = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      player: form.player.trim(),
      concept: form.concept.trim(),
      image: form.image.trim(),
      backstory: form.backstory,
      npcs: form.npcs,
    };
    if (editingId) {
      upc(pcs.map(p => p.id === editingId ? { ...p, ...data } : p));
    } else {
      upc([...pcs, { id: makeId(), ...data, owner: playerName || "GM", ts: Date.now() }]);
    }
    closeForm();
  };

  const remove = (pc) => {
    if (window.confirm(`${pc.name} wirklich löschen?`)) {
      upc(pcs.filter(p => p.id !== pc.id));
      if (expanded === pc.id) setExpanded(null);
    }
  };

  // ── Important NPCs, composed directly in the character form ──
  const commitNpc = () => {
    if (!npcDraft.name.trim()) return;
    const entry = { name: npcDraft.name.trim(), image: npcDraft.image.trim(), description: npcDraft.description.trim() };
    setForm(f => ({
      ...f,
      npcs: editingNpc
        ? f.npcs.map(n => n.id === editingNpc ? { ...n, ...entry } : n)
        : [...f.npcs, { id: makeId(), ...entry }],
    }));
    setNpcDraft(emptyNpcDraft); setEditingNpc(null);
  };
  const editDraftNpc = (npc) => { setEditingNpc(npc.id); setNpcDraft({ name: npc.name || "", image: npc.image || "", description: npc.description || "" }); };
  const cancelDraftNpc = () => { setNpcDraft(emptyNpcDraft); setEditingNpc(null); };
  const removeDraftNpc = (id) => {
    setForm(f => ({ ...f, npcs: f.npcs.filter(n => n.id !== id) }));
    if (editingNpc === id) cancelDraftNpc();
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <div className="section-head">
          <div className="eyebrow">Kampagne · Iere</div>
          <h1 className="section-title">Player Character's</h1>
          <p className="section-sub">Die Runde, die sich auf Iere wagt.</p>
        </div>
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

          {/* Important NPCs — added right here while creating the character */}
          <div className="f-group">
            <label className="f-label">Wichtige NPCs</label>
            {form.npcs.length > 0 && (
              <div className="npc-grid" style={{ marginBottom: "0.7rem" }}>
                {form.npcs.map(npc => (
                  <div key={npc.id} className="npc-card" style={{ cursor: "default" }}>
                    <div className="npc-img">
                      {npc.image ? <img src={npc.image} alt={npc.name} onError={e => { e.target.style.display = "none"; }} /> : "👤"}
                    </div>
                    <div className="npc-card-body">
                      <p className="npc-card-name">{npc.name}</p>
                      {npc.description && <p className="npc-card-faction" style={{ whiteSpace: "pre-wrap" }}>{npc.description}</p>}
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                        <button type="button" className="card-act-edit" title="Bearbeiten" onClick={() => editDraftNpc(npc)}>✎</button>
                        <button type="button" className="btn-danger" title="Löschen" onClick={() => removeDraftNpc(npc.id)}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pc-npc-add">
              <div className="f-row">
                <div className="f-group"><label className="f-label">Bild-URL (opt.)</label>
                  <input className="f-input" value={npcDraft.image} onChange={e => setNpcDraft(d => ({ ...d, image: e.target.value }))} placeholder="i.imgur.com/..." /></div>
                <div className="f-group"><label className="f-label">NPC-Name</label>
                  <input className="f-input" value={npcDraft.name} onChange={e => setNpcDraft(d => ({ ...d, name: e.target.value }))} placeholder="z.B. Mama Laveaux" /></div>
              </div>
              <div className="f-group"><label className="f-label">Beschreibung</label>
                <textarea className="f-input" rows={2} value={npcDraft.description} onChange={e => setNpcDraft(d => ({ ...d, description: e.target.value }))}
                  placeholder="Wer ist diese Person für deinen Charakter? Beziehung, Rolle, Wichtiges..." style={{ resize: "vertical", fontFamily: "'Spectral', serif" }} /></div>
              <div className="f-actions">
                <button type="button" className="btn-add" onClick={commitNpc} disabled={!npcDraft.name.trim()}>{editingNpc ? "NPC speichern" : "+ NPC hinzufügen"}</button>
                {(editingNpc || npcDraft.name || npcDraft.image || npcDraft.description) &&
                  <button type="button" className="btn-secondary" onClick={cancelDraftNpc}>Verwerfen</button>}
              </div>
            </div>
          </div>

          <div className="f-actions">
            <button className="btn-primary" onClick={save} disabled={!form.name.trim()}>Charakter speichern</button>
            <button className="btn-secondary" onClick={closeForm}>Abbrechen</button>
          </div>
        </div>
      )}

      {pcs.length === 0 && !showForm && (
        <div className="empty">
          Noch keine Charaktere.<br />
          {canWrite ? "Lege deinen Charakter an ✦" : "Gib oben deinen Namen ein, um deinen Charakter anzulegen ✦"}
        </div>
      )}

      <div className="pc-grid">
        {pcs.map((pc, i) => {
          const hue = HUES[i % HUES.length];
          const npcs = pc.npcs || [];
          const editable = canEdit(pc);
          return (
            <article key={pc.id} className="pc-card">
              <div className="pc-portrait" style={{ borderBottomColor: hue }}>
                {pc.image
                  ? <img src={pc.image} alt={pc.name} onError={e => { e.target.style.display = "none"; }} />
                  : <span className="pc-portrait-ph">🎭</span>}
                <div className="pc-portrait-overlay">
                  {pc.concept && <div className="pc-playbook" style={{ color: hue }}>{pc.concept}</div>}
                  <div className="pc-name">{pc.name}</div>
                </div>
                {editable && (
                  <div className="pc-card-actions">
                    <button className="pc-icon-btn" title="Bearbeiten" onClick={() => startEdit(pc)}>✎</button>
                    <button className="pc-icon-btn danger" title="Löschen" onClick={() => remove(pc)}>🗑</button>
                  </div>
                )}
              </div>
              <div className="pc-card-body">
                <div>
                  <div className="pc-card-sublabel">Hintergrund</div>
                  {pc.backstory
                    ? <div className="narrative pc-backstory" dangerouslySetInnerHTML={{ __html: pc.backstory }} />
                    : <p className="pc-empty-note">Noch keine Hintergrundgeschichte.{editable ? " Tippe auf ✎, um sie zu schreiben." : ""}</p>}
                </div>
                {npcs.length > 0 && (
                  <div className="pc-nsc-block">
                    <div className="pc-card-sublabel">Wichtige NSCs</div>
                    <div className="pc-nsc-list">
                      {npcs.map(npc => (
                        <div key={npc.id} className="pc-nsc-row">
                          <span className="pc-nsc-left">
                            <span className="pc-nsc-avatar" style={{ boxShadow: `0 0 0 2px ${hue}33` }}>
                              {npc.image
                                ? <img src={npc.image} alt={npc.name} onError={e => { e.target.style.display = "none"; }} />
                                : (npc.name || "?").charAt(0).toUpperCase()}
                            </span>
                            <span className="pc-nsc-name">{npc.name}</span>
                          </span>
                          {npc.description && <span className="pc-nsc-rel">{npc.description}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pc.player && <div className="pc-card-foot">Gespielt von {pc.player} · angelegt {formatDate(pc.ts)}</div>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

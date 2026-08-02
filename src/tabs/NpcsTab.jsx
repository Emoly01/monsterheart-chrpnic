import { useState, useEffect, useMemo, useRef } from "react";
import { NPC_STATUSES, NPC_CIRCLES, NPC_SORT_OPTIONS, sortNpcs, npcColor, npcCircle, npcCircleId, makeId } from "../constants.js";

const blankForm = () => ({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
const norm = (s) => (s || "").trim().toLowerCase();

// NPCs a player adds on their character sheet are not copied into the NPC
// collection — they stay owned by the character and are projected into this tab,
// so both views always show the same data. An NPC whose name already exists here
// is merged into the existing card instead of showing up twice.
//
// On a character sheet, `description` answers "who is this person for *my*
// character" — that is the relationship, and it belongs to that character, not
// to the NPC. It is surfaced here as a relation; the NPC's own neutral
// description lives in `npcDescription` so the two never overwrite each other.
function projectPcNpcs(npcs, pcs) {
  const byName = new Map();
  npcs.forEach(n => { if (!byName.has(norm(n.name))) byName.set(norm(n.name), n); });
  const derived = [];
  const relations = new Map(); // npc id -> [{ pcId, pcName, entryId, text }]
  (pcs || []).forEach(pc => {
    (pc.npcs || []).forEach(pn => {
      if (!pn?.name) return;
      let target = byName.get(norm(pn.name));
      if (!target) {
        target = {
          ...pn,
          faction: pn.faction || "",
          description: pn.npcDescription || "",
          imageUrl: pn.image || pn.imageUrl || "",
          status: pn.status || "unbekannt",
          location: pn.location || "unbekannt",
          notes: pn.notes || "",
          impressions: pn.impressions || [],
          source: "pc", pcId: pc.id,
        };
        derived.push(target);
        byName.set(norm(pn.name), target);
      }
      relations.set(target.id, [...(relations.get(target.id) || []),
        { pcId: pc.id, pcName: pc.name || pc.player || "Charakter", entryId: pn.id, text: pn.description || "" }]);
    });
  });
  return { allNpcs: [...npcs, ...derived], pcRelations: relations };
}

// Fold an NPC-tab edit back into the shape a character sheet stores. `description`
// stays untouched — that is the character's relationship, edited separately.
const toEmbedded = (orig, next) => ({
  ...orig,
  name: next.name,
  image: next.imageUrl || "",
  npcDescription: next.description || "",
  faction: next.faction || "",
  status: next.status || "unbekannt",
  location: next.location || "unbekannt",
  notes: next.notes || "",
  impressions: next.impressions || [],
});

export default function NpcsTab({ gmMode, playerName, npcs, un, pcs = [], upc }) {
  const [npcForm, setNpcForm] = useState(blankForm());
  const [editingNpc, setEditingNpc] = useState(null);
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [expandedNpc, setExpandedNpc] = useState(null);
  const [circleFilter, setCircleFilter] = useState("all");
  const [npcSearch, setNpcSearch] = useState("");
  const [npcSort, setNpcSort] = useState("alpha");
  const [npcImpression, setNpcImpression] = useState({ npcId: null, text: "" });
  const [editingImpression, setEditingImpression] = useState(null);
  const [editingImpressionText, setEditingImpressionText] = useState("");
  const [editingRelation, setEditingRelation] = useState(null); // { npcId, entryId }
  const [relationText, setRelationText] = useState("");
  const [newRelation, setNewRelation] = useState({ npcId: null, pcId: "", text: "" });

  // ── Ref for NPC detail scroll ──
  const npcDetailRef = useRef(null);

  const { allNpcs, pcRelations } = useMemo(() => projectPcNpcs(npcs, pcs), [npcs, pcs]);
  const findNpc = (id) => allNpcs.find(n => n.id === id);

  // Auto-scroll to NPC detail when one is expanded
  useEffect(() => {
    if (expandedNpc && npcDetailRef.current) {
      // Small delay to let the DOM render
      setTimeout(() => {
        npcDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [expandedNpc]);

  // Writes go to whichever list owns the NPC: the shared collection, or the
  // character sheet it was created on.
  const updateNpc = (id, patch) => {
    const target = findNpc(id);
    if (!target) return;
    if (target.source === "pc") {
      if (!upc) return;
      upc(pcs.map(pc => pc.id !== target.pcId ? pc : {
        ...pc,
        npcs: (pc.npcs || []).map(pn => pn.id !== id ? pn : toEmbedded(pn, { ...target, ...patch })),
      }));
    } else {
      un(npcs.map(n => n.id !== id ? n : { ...n, ...patch }));
    }
  };

  const saveNpc = () => {
    if (!npcForm.name.trim()) return;
    if (editingNpc) { updateNpc(editingNpc, npcForm); }
    else { un([{ id: makeId(), ...npcForm, impressions: [] }, ...npcs]); }
    setNpcForm(blankForm());
    setEditingNpc(null); setShowNpcForm(false);
  };

  const addImpression = (npcId) => {
    const n = findNpc(npcId);
    if (!npcImpression.text.trim() || !playerName || !n) return;
    updateNpc(npcId, { impressions: [...(n.impressions || []), { id: makeId(), text: npcImpression.text.trim(), author: playerName, ts: Date.now() }] });
    setNpcImpression({ npcId: null, text: "" });
  };

  const saveImpression = (npcId, impId) => {
    const n = findNpc(npcId);
    if (!editingImpressionText.trim() || !n) return;
    updateNpc(npcId, { impressions: (n.impressions || []).map(imp => imp.id === impId ? { ...imp, text: editingImpressionText.trim() } : imp) });
    setEditingImpression(null);
    setEditingImpressionText("");
  };

  const removeImpression = (npcId, impId) => {
    const n = findNpc(npcId);
    if (!n) return;
    updateNpc(npcId, { impressions: (n.impressions || []).filter(imp => imp.id !== impId) });
  };

  // A relation lives on the character's sheet, so every change writes there.
  const patchPcNpcs = (pcId, fn) => upc?.(pcs.map(pc => pc.id !== pcId ? pc : { ...pc, npcs: fn(pc.npcs || []) }));

  const saveRelation = (npcId, pcId, entryId) => {
    if (!relationText.trim()) return;
    patchPcNpcs(pcId, list => list.map(pn => pn.id !== entryId ? pn : { ...pn, description: relationText.trim() }));
    setEditingRelation(null); setRelationText("");
  };

  const removeRelation = (npcId, pcId, entryId, pcName) => {
    const n = findNpc(npcId);
    if (!window.confirm(`Beziehung zu ${pcName} entfernen? ${n?.name || "Der NPC"} verschwindet damit auch aus diesem Steckbrief.`)) return;
    patchPcNpcs(pcId, list => list.filter(pn => pn.id !== entryId));
    if (editingRelation?.entryId === entryId) { setEditingRelation(null); setRelationText(""); }
  };

  // Adding a relation copies the NPC onto that character's sheet — same entry the
  // player would have created there by hand, so both views stay in sync.
  const addRelation = (npcId) => {
    const n = findNpc(npcId);
    if (!n || !newRelation.pcId || !newRelation.text.trim()) return;
    patchPcNpcs(newRelation.pcId, list => [...list, {
      id: makeId(), name: n.name, image: n.imageUrl || "", description: newRelation.text.trim(),
    }]);
    setNewRelation({ npcId: null, pcId: "", text: "" });
  };

  const deleteNpc = (id) => {
    const target = findNpc(id);
    if (!target) return;
    const relations = pcRelations.get(id) || [];
    // A merged NPC also lives on a character sheet; deleting it here only drops
    // the shared entry, so say that instead of letting the card reappear
    // unexplained.
    const msg = target.source !== "pc" && relations.length > 0
      ? `${target.name} steht auch im Steckbrief von ${relations.map(r => r.pcName).join(", ")}. Aus der NPC-Liste löschen? Der Eintrag beim Charakter bleibt erhalten und wird weiter hier angezeigt.`
      : `${target.name} wirklich löschen?`;
    if (!window.confirm(msg)) return;
    if (target.source === "pc") {
      upc?.(pcs.map(pc => pc.id !== target.pcId ? pc : { ...pc, npcs: (pc.npcs || []).filter(pn => pn.id !== id) }));
    } else {
      un(npcs.filter(n => n.id !== id));
    }
    if (expandedNpc === id) setExpandedNpc(null);
    if (editingNpc === id) { setEditingNpc(null); setShowNpcForm(false); setNpcForm(blankForm()); }
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <div className="section-head">
          <div className="eyebrow">Kampagne · Iere</div>
          <h1 className="section-title">Gesichter</h1>
          <p className="section-sub">Wer euch das Leben schwer macht — Familie, Lehrer:innen, Flammen und Feinde.</p>
        </div>
        <button className="btn-add" onClick={() => { setShowNpcForm(v => !v); setEditingNpc(null); setNpcForm(blankForm()); }}>+ NPC hinzufügen</button>
      </div>
      {showNpcForm && (
        <div className="form-panel">
          <p className="form-title">{editingNpc ? "NPC bearbeiten" : "Neuer NPC"}</p>
          {editingNpc && findNpc(editingNpc)?.source === "pc" && (
            <p className="npc-pc-hint">Dieser NPC gehört zu einem Charakter-Steckbrief — Änderungen erscheinen auch dort.</p>
          )}
          <div className="f-row">
            <div className="f-group"><label className="f-label">Name</label>
              <input className="f-input" value={npcForm.name} onChange={e => setNpcForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Ms. Baptiste" autoFocus /></div>
            <div className="f-group"><label className="f-label">Rolle / Verbindung</label>
              <input className="f-input" value={npcForm.faction} onChange={e => setNpcForm(f=>({...f,faction:e.target.value}))} placeholder="z.B. Lehrerin, Cousin, Ex" /></div>
          </div>
          <div className="f-group"><label className="f-label">Beschreibung</label>
            <textarea className="f-input" rows={2} value={npcForm.description} onChange={e => setNpcForm(f=>({...f,description:e.target.value}))} placeholder="Was alle über diese Person wissen..." /></div>
          <div className="f-group"><label className="f-label">Bild-URL (optional — i.imgur.com/...)</label>
            <input className="f-input" value={npcForm.imageUrl} onChange={e => setNpcForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/abc123.jpg" /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Status</label>
              <select className="f-select" value={npcForm.status} onChange={e => setNpcForm(f=>({...f,status:e.target.value}))}>
                {NPC_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="f-group"><label className="f-label">Umfeld</label>
              <select className="f-select" value={npcCircleId(npcForm.location)} onChange={e => setNpcForm(f=>({...f,location:e.target.value}))}>
                {NPC_CIRCLES.filter(l => l.id !== "all").map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
              </select>
            </div>
          </div>
          {/* GM notes stay in the form state while a player edits, so they are
              never dropped — only the GM gets to see and change them. */}
          {gmMode && (
            <div className="f-group"><label className="f-label">🔐 Nur für den SL</label>
              <textarea className="f-input" rows={3} value={npcForm.notes} onChange={e => setNpcForm(f=>({...f,notes:e.target.value}))} placeholder="Was niemand am Tisch wissen soll..." /></div>
          )}
          <div className="f-actions">
            <button className="btn-primary" onClick={saveNpc} disabled={!npcForm.name.trim()}>Speichern</button>
            <button className="btn-secondary" onClick={() => { setShowNpcForm(false); setEditingNpc(null); }}>Abbrechen</button>
            {editingNpc && <button className="btn-delete" style={{marginLeft:"auto"}} onClick={() => deleteNpc(editingNpc)}>🗑 NPC löschen</button>}
          </div>
        </div>
      )}

      {/* Location tabs */}
      {allNpcs.length > 0 && (
        <div className="npc-loc-tabs">
          {NPC_CIRCLES.map(l => {
            const count = l.id === "all" ? allNpcs.length : allNpcs.filter(n => npcCircleId(n.location) === l.id).length;
            if (l.id !== "all" && count === 0) return null;
            return (
              <button key={l.id} className={`npc-loc-tab ${circleFilter === l.id ? "active" : ""}`}
                onClick={() => setCircleFilter(l.id)}>
                <span>{l.icon}</span>{l.label}
                <span style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.38rem",opacity:0.7,marginLeft:"0.15rem"}}>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search + Sort row */}
      {allNpcs.length > 0 && (
        <div className="npc-controls-row">
          <div className="npc-search-wrap">
            <span className="npc-search-icon">🔍</span>
            <input className="npc-search-input" value={npcSearch}
              onChange={e => setNpcSearch(e.target.value)}
              placeholder="Nach Name, Rolle oder Charakter suchen..." />
          </div>
          <div className="npc-sort-wrap">
            {NPC_SORT_OPTIONS.map(s => (
              <button key={s.id} className={`npc-sort-btn ${npcSort === s.id ? "active" : ""}`}
                onClick={() => setNpcSort(s.id)} title={s.label}>
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NPC Detail — rendered above the grid, with scroll ref */}
      {expandedNpc && (() => {
        const n = findNpc(expandedNpc);
        if (!n) return null;
        const links = pcRelations.get(n.id) || [];
        return (
          <div className="npc-detail" ref={npcDetailRef}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
              <div>
                <p className="npc-detail-name">{n.name}</p>
                {n.faction && <p className="npc-detail-faction">{n.faction}</p>}
              </div>
              <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                <span className="tag" style={{color:npcColor(n.status),borderColor:npcColor(n.status)}}>{NPC_STATUSES.find(s=>s.id===n.status)?.label}</span>
                <button className="btn-secondary" style={{padding:"0.2rem 0.5rem",fontSize:"0.45rem"}} onClick={() => { setNpcForm({name:n.name,faction:n.faction||"",description:n.description||"",imageUrl:n.imageUrl||"",status:n.status||"unbekannt",location:n.location||"unbekannt",notes:n.notes||""}); setEditingNpc(n.id); setShowNpcForm(true); setExpandedNpc(null); }}>✎ Bearbeiten</button>
                <button className="btn-danger" onClick={() => setExpandedNpc(null)}>✕</button>
              </div>
            </div>
            {n.imageUrl
              ? <img src={n.imageUrl} alt={n.name} className="npc-detail-img" onError={e => { e.target.style.display="none"; }} />
              : <div className="npc-detail-img-placeholder">👤</div>
            }
            {gmMode
              ? n.description && <p className="npc-desc">{n.description}</p>
              : <div className="f-group" style={{marginBottom:"0.6rem"}}>
                  <label className="f-label" style={{marginBottom:"0.25rem"}}>Beschreibung</label>
                  <textarea key={n.id} className="f-input" rows={3}
                    defaultValue={n.description || ""}
                    onBlur={e => {
                      const updated = e.target.value.trim();
                      if (updated !== (n.description || "").trim()) {
                        updateNpc(n.id, { description: updated });
                      }
                    }}
                    placeholder="Was wissen die Spieler über diese Person..." />
                </div>
            }
            {/* Relationships — the text each character wrote on their own sheet. */}
            <div className="npc-rel-block">
              <p className="pc-card-sublabel" style={{marginBottom:"0.45rem"}}>Beziehung zu den Charakteren</p>
              {links.length === 0 && <p className="npc-rel-empty">Noch mit keinem Charakter verknüpft.</p>}
              {links.map(l => {
                const isEditing = editingRelation?.npcId === n.id && editingRelation?.entryId === l.entryId;
                return (
                  <div key={l.entryId} className="npc-rel-row">
                    <span className="npc-pc-chip">🎭 {l.pcName}</span>
                    {isEditing ? (
                      <>
                        <input className="npc-rel-input" value={relationText} autoFocus
                          onChange={e => setRelationText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveRelation(n.id, l.pcId, l.entryId);
                            if (e.key === "Escape") { setEditingRelation(null); setRelationText(""); }
                          }}
                          placeholder={`Wer ist ${n.name} für ${l.pcName}?`} />
                        <button className="btn-tiny btn-tiny-primary" onClick={() => saveRelation(n.id, l.pcId, l.entryId)} disabled={!relationText.trim()}>✓</button>
                        <button className="btn-tiny btn-tiny-secondary" onClick={() => { setEditingRelation(null); setRelationText(""); }}>✕</button>
                      </>
                    ) : (
                      <>
                        <span className="npc-rel-text">{l.text || <em>noch nichts eingetragen</em>}</span>
                        <button className="card-act-edit" title="Beziehung bearbeiten"
                          onClick={() => { setEditingRelation({ npcId: n.id, entryId: l.entryId }); setRelationText(l.text || ""); }}>✎</button>
                        <button className="btn-danger" title="Beziehung entfernen"
                          onClick={() => removeRelation(n.id, l.pcId, l.entryId, l.pcName)}>✕</button>
                      </>
                    )}
                  </div>
                );
              })}
              {(() => {
                const free = pcs.filter(pc => !links.some(l => l.pcId === pc.id));
                if (free.length === 0) return null;
                const active = newRelation.npcId === n.id;
                return (
                  <div className="npc-rel-row npc-rel-add">
                    <select className="f-select npc-rel-select" value={active ? newRelation.pcId : ""}
                      onChange={e => setNewRelation({ npcId: n.id, pcId: e.target.value, text: active ? newRelation.text : "" })}>
                      <option value="">+ Charakter…</option>
                      {free.map(pc => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
                    </select>
                    <input className="npc-rel-input" value={active ? newRelation.text : ""}
                      onChange={e => setNewRelation(r => ({ npcId: n.id, pcId: r.npcId === n.id ? r.pcId : "", text: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addRelation(n.id)}
                      placeholder={`Wer ist ${n.name} für diesen Charakter?`} />
                    <button className="btn-tiny btn-tiny-primary" onClick={() => addRelation(n.id)}
                      disabled={!active || !newRelation.pcId || !newRelation.text.trim()}>✓</button>
                  </div>
                );
              })()}
            </div>
            {npcCircleId(n.location) !== "unbekannt" && (
              <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.45rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#ffb400",marginBottom:"0.4rem"}}>
                {npcCircle(n.location).icon} {npcCircle(n.location).label}
              </p>
            )}
            {/* SL-Bereich: nur im GM-Modus sichtbar und direkt hier beschreibbar. */}
            {gmMode && (
              <div className="npc-gm-block">
                <p className="npc-gm-title">🔐 Nur für den SL</p>
                <textarea key={`gm-${n.id}`} className="npc-gm-input" rows={3}
                  defaultValue={n.notes || ""}
                  onBlur={e => {
                    const updated = e.target.value.trim();
                    if (updated !== (n.notes || "").trim()) updateNpc(n.id, { notes: updated });
                  }}
                  placeholder="Was niemand am Tisch wissen soll — Geheimnisse, Absichten, was diese Person wirklich will…" />
                <p className="npc-gm-hint">Wird gespeichert, sobald du das Feld verlässt.</p>
              </div>
            )}
            <div className="divider" />
            <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#9aa89c",marginBottom:"0.5rem"}}>Spieler-Eindrücke</p>
            {(n.impressions||[]).length > 0 && (
              <div className="impression-list" style={{marginBottom:"0.6rem"}}>
                {n.impressions.map(imp => {
                  const isEditingImp = editingImpression?.npcId === n.id && editingImpression?.impId === imp.id;
                  const canEditImp = gmMode || imp.author === playerName;
                  return (
                    <div key={imp.id} className="impression">
                      {isEditingImp ? (
                        <>
                          <div className="impression-edit-row">
                            <input className="impression-edit-input" value={editingImpressionText}
                              onChange={e => setEditingImpressionText(e.target.value)}
                              onKeyDown={e => { if(e.key === "Enter") saveImpression(n.id, imp.id); if(e.key === "Escape") { setEditingImpression(null); setEditingImpressionText(""); } }}
                              autoFocus />
                            <button className="btn-tiny btn-tiny-primary" onClick={() => saveImpression(n.id, imp.id)} disabled={!editingImpressionText.trim()}>✓</button>
                            <button className="btn-tiny btn-tiny-secondary" onClick={() => { setEditingImpression(null); setEditingImpressionText(""); }}>✕</button>
                          </div>
                        </>
                      ) : (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.4rem"}}>
                          <span>"{imp.text}"</span>
                          {canEditImp && (
                            <div style={{display:"flex",gap:"0.2rem",flexShrink:0,marginTop:"0.05rem"}}>
                              <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.35rem"}}
                                onClick={() => { setEditingImpression({npcId:n.id,impId:imp.id}); setEditingImpressionText(imp.text); }}>✎</button>
                              <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.35rem",color:"#ff2b1c",borderColor:"#a83a30"}}
                                onClick={() => removeImpression(n.id, imp.id)}>✕</button>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="impression-author">— {imp.author}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {playerName && (
              <div style={{display:"flex",gap:"0.5rem"}}>
                <input className="f-input" style={{flex:1}} value={npcImpression.npcId === n.id ? npcImpression.text : ""}
                  onChange={e => setNpcImpression({npcId:n.id,text:e.target.value})}
                  onKeyDown={e => e.key === "Enter" && addImpression(n.id)}
                  placeholder={`Dein Eindruck von ${n.name}...`} />
                <button className="btn-primary" style={{whiteSpace:"nowrap"}} onClick={() => addImpression(n.id)}
                  disabled={npcImpression.npcId !== n.id || !npcImpression.text.trim()}>✦ Senden</button>
              </div>
            )}
            <div style={{marginTop:"1rem",paddingTop:"0.8rem",borderTop:"1px solid #1d2822",textAlign:"center"}}>
              <button className="btn-secondary" onClick={() => setExpandedNpc(null)}>✕ Schließen</button>
            </div>
          </div>
        );
      })()}

      {allNpcs.length === 0
        ? <div className="empty">Noch keine NPCs eingetragen.<br /><span style={{fontSize:"0.85rem"}}>Die Welt füllt sich langsam... 👥</span></div>
        : (() => {
          const filtered = allNpcs.filter(n => {
            const locMatch = circleFilter === "all" || npcCircleId(n.location) === circleFilter;
            const q = npcSearch.toLowerCase().trim();
            const linkedTo = (pcRelations.get(n.id) || []).map(l => `${l.pcName} ${l.text}`.toLowerCase()).join(" ");
            const searchMatch = !q || n.name.toLowerCase().includes(q) || (n.faction||"").toLowerCase().includes(q) || linkedTo.includes(q);
            return locMatch && searchMatch;
          });
          const sorted = sortNpcs(filtered, npcSort);
          if (sorted.length === 0) return (
            <div className="empty" style={{paddingTop:"1.5rem"}}>
              Keine NPCs gefunden.<br /><span style={{fontSize:"0.85rem"}}>Versuch eine andere Suche oder einen anderen Ort. ✦</span>
            </div>
          );
          return (
            <div className="npc-grid">
              {sorted.map(n => {
                const links = pcRelations.get(n.id) || [];
                return (
                  <div key={n.id} className={`npc-card ${expandedNpc === n.id ? "selected" : ""}`} onClick={() => setExpandedNpc(expandedNpc === n.id ? null : n.id)}>
                    <div className="npc-img">
                      {n.imageUrl ? <img src={n.imageUrl} alt={n.name} onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML="👤"; }} /> : "👤"}
                    </div>
                    <div className="npc-card-body">
                      <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.1rem"}}>
                        <span className="npc-status-dot" style={{background:npcColor(n.status)}} />
                        <p className="npc-card-name">{n.name}</p>
                        {gmMode && n.notes && <span className="npc-card-lock" title="SL-Notizen vorhanden">🔐</span>}
                      </div>
                      {n.faction && <p className="npc-card-faction">{n.faction}</p>}
                      {links.length > 0 && (
                        <div className="npc-pc-chips">
                          {links.map(l => (
                            <span key={l.entryId} className="npc-pc-chip-row">
                              <span className="npc-pc-chip">🎭 {l.pcName}</span>
                              {l.text && <span className="npc-pc-chip-text">{l.text}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      {npcCircleId(n.location) !== "unbekannt" && (
                        <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.38rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#ffb400",marginTop:"0.2rem"}}>
                          {npcCircle(n.location).icon} {npcCircle(n.location).label}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      }
    </div>
  );
}

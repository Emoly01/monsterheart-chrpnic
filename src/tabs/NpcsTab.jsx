import { useState, useEffect, useMemo, useRef } from "react";
import { NPC_STATUSES, NPC_LOCATIONS, NPC_SORT_OPTIONS, sortNpcs, npcColor, makeId } from "../constants.js";

const blankForm = () => ({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
const norm = (s) => (s || "").trim().toLowerCase();

// NPCs a player adds on their character sheet are not copied into the NPC
// collection — they stay owned by the character and are projected into this tab,
// so both views always show the same data. An NPC whose name already exists here
// is merged into the existing card instead of showing up twice.
function projectPcNpcs(npcs, pcs) {
  const byName = new Map();
  npcs.forEach(n => { if (!byName.has(norm(n.name))) byName.set(norm(n.name), n); });
  const derived = [];
  const links = new Map(); // npc id -> [{ pcId, pcName, description }]
  (pcs || []).forEach(pc => {
    (pc.npcs || []).forEach(pn => {
      if (!pn?.name) return;
      let target = byName.get(norm(pn.name));
      if (!target) {
        target = {
          ...pn,
          faction: pn.faction || "",
          description: pn.description || "",
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
      links.set(target.id, [...(links.get(target.id) || []),
        { pcId: pc.id, pcName: pc.name || pc.player || "Charakter", description: pn.description || "" }]);
    });
  });
  return { allNpcs: [...npcs, ...derived], pcLinks: links };
}

// Fold an NPC-tab edit back into the shape a character sheet stores.
const toEmbedded = (orig, next) => ({
  ...orig,
  name: next.name,
  image: next.imageUrl || "",
  description: next.description || "",
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
  const [npcLocation, setNpcLocation] = useState("all");
  const [npcSearch, setNpcSearch] = useState("");
  const [npcSort, setNpcSort] = useState("alpha");
  const [npcImpression, setNpcImpression] = useState({ npcId: null, text: "" });
  const [editingImpression, setEditingImpression] = useState(null);
  const [editingImpressionText, setEditingImpressionText] = useState("");

  // ── Ref for NPC detail scroll ──
  const npcDetailRef = useRef(null);

  const { allNpcs, pcLinks } = useMemo(() => projectPcNpcs(npcs, pcs), [npcs, pcs]);
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

  return (
    <div className="page">
      <div className="section-hdr">
        <div className="section-head">
          <div className="eyebrow">Kampagne · Iere</div>
          <h1 className="section-title">Gesichter</h1>
          <p className="section-sub">Die Gesichter der Insel — Verbündete, Rätsel und Gefahren.</p>
        </div>
        {gmMode && <button className="btn-add" onClick={() => { setShowNpcForm(v => !v); setEditingNpc(null); setNpcForm(blankForm()); }}>+ NPC hinzufügen</button>}
      </div>
      {gmMode && showNpcForm && (
        <div className="form-panel">
          <p className="form-title">{editingNpc ? "NPC bearbeiten" : "Neuer NPC"}</p>
          {editingNpc && findNpc(editingNpc)?.source === "pc" && (
            <p className="npc-pc-hint">Dieser NPC gehört zu einem Charakter-Steckbrief — Änderungen erscheinen auch dort.</p>
          )}
          <div className="f-row">
            <div className="f-group"><label className="f-label">Name</label>
              <input className="f-input" value={npcForm.name} onChange={e => setNpcForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Kettlesteam" autoFocus /></div>
            <div className="f-group"><label className="f-label">Fraktion / Rolle</label>
              <input className="f-input" value={npcForm.faction} onChange={e => setNpcForm(f=>({...f,faction:e.target.value}))} placeholder="z.B. Zirkus Witchlight" /></div>
          </div>
          <div className="f-group"><label className="f-label">Beschreibung</label>
            <textarea className="f-input" rows={2} value={npcForm.description} onChange={e => setNpcForm(f=>({...f,description:e.target.value}))} placeholder="Was die Spieler über sie/ihn wissen..." /></div>
          <div className="f-group"><label className="f-label">Bild-URL (optional — i.imgur.com/...)</label>
            <input className="f-input" value={npcForm.imageUrl} onChange={e => setNpcForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/abc123.jpg" /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Status</label>
              <select className="f-select" value={npcForm.status} onChange={e => setNpcForm(f=>({...f,status:e.target.value}))}>
                {NPC_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="f-group"><label className="f-label">Ort</label>
              <select className="f-select" value={npcForm.location||"unbekannt"} onChange={e => setNpcForm(f=>({...f,location:e.target.value}))}>
                {NPC_LOCATIONS.filter(l => l.id !== "all").map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
              </select>
            </div>
          </div>
          <div className="f-group"><label className="f-label">GM-Notizen (privat)</label>
            <input className="f-input" value={npcForm.notes} onChange={e => setNpcForm(f=>({...f,notes:e.target.value}))} placeholder="Was die Spieler nicht wissen..." /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={saveNpc} disabled={!npcForm.name.trim()}>Speichern</button>
            <button className="btn-secondary" onClick={() => { setShowNpcForm(false); setEditingNpc(null); }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Location tabs */}
      {allNpcs.length > 0 && (
        <div className="npc-loc-tabs">
          {NPC_LOCATIONS.map(l => {
            const count = l.id === "all" ? allNpcs.length : allNpcs.filter(n => (n.location || "unbekannt") === l.id).length;
            if (l.id !== "all" && count === 0) return null;
            return (
              <button key={l.id} className={`npc-loc-tab ${npcLocation === l.id ? "active" : ""}`}
                onClick={() => setNpcLocation(l.id)}>
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
              placeholder="Nach Name, Fraktion oder Charakter suchen..." />
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
        const links = pcLinks.get(n.id) || [];
        return (
          <div className="npc-detail" ref={npcDetailRef}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
              <div>
                <p className="npc-detail-name">{n.name}</p>
                {n.faction && <p className="npc-detail-faction">{n.faction}</p>}
              </div>
              <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                <span className="tag" style={{color:npcColor(n.status),borderColor:npcColor(n.status)}}>{NPC_STATUSES.find(s=>s.id===n.status)?.label}</span>
                {gmMode && <button className="btn-secondary" style={{padding:"0.2rem 0.5rem",fontSize:"0.45rem"}} onClick={() => { setNpcForm({name:n.name,faction:n.faction||"",description:n.description||"",imageUrl:n.imageUrl||"",status:n.status||"unbekannt",location:n.location||"unbekannt",notes:n.notes||""}); setEditingNpc(n.id); setShowNpcForm(true); setExpandedNpc(null); }}>✎ Bearbeiten</button>}
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
            {links.length > 0 && (
              <div className="npc-pc-links">
                <p className="pc-card-sublabel" style={{marginBottom:"0.45rem"}}>Aus Charakter-Steckbriefen</p>
                {links.map(l => (
                  <div key={l.pcId} className="npc-pc-link">
                    <span className="npc-pc-chip">🎭 {l.pcName}</span>
                    {l.description && norm(l.description) !== norm(n.description) &&
                      <span className="npc-pc-link-desc">{l.description}</span>}
                  </div>
                ))}
              </div>
            )}
            {n.location && n.location !== "unbekannt" && (
              <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.45rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#ffb400",marginBottom:"0.4rem"}}>
                {NPC_LOCATIONS.find(l=>l.id===n.location)?.icon} {NPC_LOCATIONS.find(l=>l.id===n.location)?.label}
              </p>
            )}
            {gmMode && n.notes && <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.5rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#ffb400",marginBottom:"0.3rem",marginTop:"0.5rem"}}>GM-Notiz: <span style={{fontFamily:"'Spectral', serif",fontStyle:"italic",fontSize:"0.8rem",letterSpacing:0,textTransform:"none",color:"#9aa89c"}}>{n.notes}</span></p>}
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
            const locMatch = npcLocation === "all" || (n.location || "unbekannt") === npcLocation;
            const q = npcSearch.toLowerCase().trim();
            const linkedTo = (pcLinks.get(n.id) || []).map(l => l.pcName.toLowerCase()).join(" ");
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
                const links = pcLinks.get(n.id) || [];
                return (
                  <div key={n.id} className={`npc-card ${expandedNpc === n.id ? "selected" : ""}`} onClick={() => setExpandedNpc(expandedNpc === n.id ? null : n.id)}>
                    <div className="npc-img">
                      {n.imageUrl ? <img src={n.imageUrl} alt={n.name} onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML="👤"; }} /> : "👤"}
                    </div>
                    <div className="npc-card-body">
                      <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.1rem"}}>
                        <span className="npc-status-dot" style={{background:npcColor(n.status)}} />
                        <p className="npc-card-name">{n.name}</p>
                      </div>
                      {n.faction && <p className="npc-card-faction">{n.faction}</p>}
                      {links.length > 0 && (
                        <div className="npc-pc-chips">
                          {links.map(l => <span key={l.pcId} className="npc-pc-chip">🎭 {l.pcName}</span>)}
                        </div>
                      )}
                      {n.location && n.location !== "unbekannt" && (
                        <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.38rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#ffb400",marginTop:"0.2rem"}}>
                          {NPC_LOCATIONS.find(l=>l.id===n.location)?.icon} {NPC_LOCATIONS.find(l=>l.id===n.location)?.label}
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

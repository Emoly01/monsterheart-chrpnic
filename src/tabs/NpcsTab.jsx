import { useState, useEffect, useRef } from "react";
import { NPC_STATUSES, NPC_LOCATIONS, NPC_SORT_OPTIONS, sortNpcs, npcColor, makeId } from "../constants.js";

export default function NpcsTab({ gmMode, playerName, npcs, un }) {
  const [npcForm, setNpcForm] = useState({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
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

  // Auto-scroll to NPC detail when one is expanded
  useEffect(() => {
    if (expandedNpc && npcDetailRef.current) {
      // Small delay to let the DOM render
      setTimeout(() => {
        npcDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [expandedNpc]);

  const saveNpc = () => {
    if (!npcForm.name.trim()) return;
    if (editingNpc) { un(npcs.map(n => n.id === editingNpc ? { ...n, ...npcForm } : n)); }
    else { un([{ id: makeId(), ...npcForm, impressions: [] }, ...npcs]); }
    setNpcForm({ name: "", faction: "", description: "", imageUrl: "", status: "lebendig", location: "unbekannt", notes: "" });
    setEditingNpc(null); setShowNpcForm(false);
  };

  const addImpression = (npcId) => {
    if (!npcImpression.text.trim() || !playerName) return;
    un(npcs.map(n => n.id === npcId ? { ...n, impressions: [...(n.impressions || []), { id: makeId(), text: npcImpression.text.trim(), author: playerName, ts: Date.now() }] } : n));
    setNpcImpression({ npcId: null, text: "" });
  };

  const saveImpression = (npcId, impId) => {
    if (!editingImpressionText.trim()) return;
    un(npcs.map(n => n.id === npcId
      ? { ...n, impressions: (n.impressions || []).map(imp => imp.id === impId ? { ...imp, text: editingImpressionText.trim() } : imp) }
      : n
    ));
    setEditingImpression(null);
    setEditingImpressionText("");
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">👥 Gesichter</p>
        {gmMode && <button className="btn-add" onClick={() => { setShowNpcForm(v => !v); setEditingNpc(null); setNpcForm({name:"",faction:"",description:"",imageUrl:"",status:"lebendig",location:"unbekannt",notes:""}); }}>+ NPC hinzufügen</button>}
      </div>
      {gmMode && showNpcForm && (
        <div className="form-panel">
          <p className="form-title">{editingNpc ? "NPC bearbeiten" : "Neuer NPC"}</p>
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
      {npcs.length > 0 && (
        <div className="npc-loc-tabs">
          {NPC_LOCATIONS.map(l => {
            const count = l.id === "all" ? npcs.length : npcs.filter(n => (n.location || "unbekannt") === l.id).length;
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
      {npcs.length > 0 && (
        <div className="npc-controls-row">
          <div className="npc-search-wrap">
            <span className="npc-search-icon">🔍</span>
            <input className="npc-search-input" value={npcSearch}
              onChange={e => setNpcSearch(e.target.value)}
              placeholder="Nach Name oder Fraktion suchen..." />
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
        const n = npcs.find(x => x.id === expandedNpc);
        if (!n) return null;
        return (
          <div className="npc-detail" ref={npcDetailRef}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
              <div>
                <p className="npc-detail-name">{n.name}</p>
                {n.faction && <p className="npc-detail-faction">{n.faction}</p>}
              </div>
              <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                <span className="tag" style={{color:npcColor(n.status),borderColor:npcColor(n.status)}}>{NPC_STATUSES.find(s=>s.id===n.status)?.label}</span>
                {gmMode && <button className="btn-secondary" style={{padding:"0.2rem 0.5rem",fontSize:"0.45rem"}} onClick={() => { setNpcForm({name:n.name,faction:n.faction||"",description:n.description||"",imageUrl:n.imageUrl||"",status:n.status,location:n.location||"unbekannt",notes:n.notes||""}); setEditingNpc(n.id); setShowNpcForm(true); setExpandedNpc(null); }}>✎ Bearbeiten</button>}
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
                        un(npcs.map(x => x.id === n.id ? { ...x, description: updated } : x));
                      }
                    }}
                    placeholder="Was wissen die Spieler über diese Person..." />
                </div>
            }
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
                                onClick={() => un(npcs.map(x => x.id === n.id ? {...x, impressions:(x.impressions||[]).filter(i => i.id !== imp.id)} : x))}>✕</button>
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

      {npcs.length === 0
        ? <div className="empty">Noch keine NPCs eingetragen.<br /><span style={{fontSize:"0.85rem"}}>Die Welt füllt sich langsam... 👥</span></div>
        : (() => {
          const filtered = npcs.filter(n => {
            const locMatch = npcLocation === "all" || (n.location || "unbekannt") === npcLocation;
            const q = npcSearch.toLowerCase().trim();
            const searchMatch = !q || n.name.toLowerCase().includes(q) || (n.faction||"").toLowerCase().includes(q);
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
              {sorted.map(n => (
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
                    {n.location && n.location !== "unbekannt" && (
                      <p style={{fontFamily:"'Archivo', sans-serif",fontSize:"0.38rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#ffb400",marginTop:"0.2rem"}}>
                        {NPC_LOCATIONS.find(l=>l.id===n.location)?.icon} {NPC_LOCATIONS.find(l=>l.id===n.location)?.label}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      }
    </div>
  );
}

import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { GM_CATEGORIES, makeId, formatDate } from "../constants.js";

export default function GmPlanTab({ pcDossiers, upd, worldEntries, uwe, quickNotes, uqn, gmNotes, ugn }) {
  const [gmPlanTab, setGmPlanTab] = useState("dossiers");

  // ── PC Dossier forms ──
  const [dossierForm, setDossierForm] = useState({ name: "", imageUrl: "", backstory: "", threads: "", relationships: "", arc: "" });
  const [showDossierForm, setShowDossierForm] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [expandedDossier, setExpandedDossier] = useState(null);
  const [expandedDossierSection, setExpandedDossierSection] = useState({});

  // ── World Entry forms ──
  const [worldForm, setWorldForm] = useState({ title: "", text: "", type: "ort", imageUrl: "" });
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [editingWorld, setEditingWorld] = useState(null);
  const [expandedWorld, setExpandedWorld] = useState(null);
  const [worldFilter, setWorldFilter] = useState("all");

  // ── Quick Note forms ──
  const [qnForm, setQnForm] = useState({ text: "", tag: "" });
  const [editingQn, setEditingQn] = useState(null);

  // ── Legacy GM note forms ──
  const [gmNoteForm, setGmNoteForm] = useState({ title: "", text: "", category: "plan" });
  const [showGmNoteForm, setShowGmNoteForm] = useState(false);
  const [editingGmNote, setEditingGmNote] = useState(null);
  const [expandedGmNote, setExpandedGmNote] = useState(null);

  const saveDossier = () => {
    if (!dossierForm.name.trim()) return;
    if (editingDossier) {
      upd(pcDossiers.map(d => d.id === editingDossier ? { ...d, ...dossierForm } : d));
      setEditingDossier(null);
    } else {
      upd([...pcDossiers, { id: makeId(), ...dossierForm, ts: Date.now() }]);
    }
    setDossierForm({ name: "", imageUrl: "", backstory: "", threads: "", relationships: "", arc: "" });
    setShowDossierForm(false);
  };

  const startEditDossier = (d) => {
    setDossierForm({ name: d.name, imageUrl: d.imageUrl || "", backstory: d.backstory || "", threads: d.threads || "", relationships: d.relationships || "", arc: d.arc || "" });
    setEditingDossier(d.id); setShowDossierForm(true); setExpandedDossier(null);
  };

  const saveWorldEntry = () => {
    if (!worldForm.title.trim()) return;
    if (editingWorld) {
      uwe(worldEntries.map(w => w.id === editingWorld ? { ...w, ...worldForm } : w));
      setEditingWorld(null);
    } else {
      uwe([{ id: makeId(), ...worldForm, ts: Date.now() }, ...worldEntries]);
    }
    setWorldForm({ title: "", text: "", type: "ort", imageUrl: "" });
    setShowWorldForm(false);
  };

  const addQuickNote = () => {
    if (!qnForm.text.trim()) return;
    if (editingQn) {
      uqn(quickNotes.map(n => n.id === editingQn ? { ...n, text: qnForm.text.trim(), tag: qnForm.tag.trim() } : n));
      setEditingQn(null);
    } else {
      uqn([{ id: makeId(), text: qnForm.text.trim(), tag: qnForm.tag.trim(), done: false, ts: Date.now() }, ...quickNotes]);
    }
    setQnForm({ text: "", tag: "" });
  };

  const toggleQuickNote = (id) => {
    uqn(quickNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  const saveGmNote = () => {
    if (!gmNoteForm.title.trim()) return;
    if (editingGmNote) {
      ugn(gmNotes.map(n => n.id === editingGmNote ? { ...n, ...gmNoteForm } : n));
      setEditingGmNote(null);
    } else {
      ugn([{ id: makeId(), ...gmNoteForm, ts: Date.now() }, ...gmNotes]);
    }
    setGmNoteForm({ title: "", text: "", category: "plan" }); setShowGmNoteForm(false);
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🔐 GM-Zentrale</p>
      </div>

      {/* Sub-navigation */}
      <div className="gm-sub-tabs">
        {[
          { id: "dossiers", icon: "👤", label: "PC Dossiers", count: pcDossiers.length },
          { id: "world",    icon: "🌍", label: "Weltenarchiv", count: worldEntries.length },
          { id: "quick",    icon: "📝", label: "Quick Notes", count: quickNotes.filter(n=>!n.done).length },
          { id: "legacy",   icon: "📋", label: "Notizen", count: gmNotes.length },
        ].map(t => (
          <button key={t.id} className={`gm-sub-tab ${gmPlanTab === t.id ? "active" : ""}`}
            onClick={() => setGmPlanTab(t.id)}>
            <span>{t.icon}</span>{t.label}
            {t.count > 0 && <span className="gm-sub-count">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ── PC DOSSIERS ── */}
      {gmPlanTab === "dossiers" && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
            <button className="btn-add" onClick={() => { setShowDossierForm(v => !v); setEditingDossier(null); setDossierForm({ name:"", imageUrl:"", backstory:"", threads:"", relationships:"", arc:"" }); }}>+ Neuer PC</button>
          </div>

          {showDossierForm && (
            <div className="form-panel">
              <p className="form-title">{editingDossier ? "PC bearbeiten" : "Neues PC Dossier"}</p>
              <div className="f-row">
                <div className="f-group"><label className="f-label">Charaktername</label>
                  <input className="f-input" value={dossierForm.name} onChange={e => setDossierForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Eya" autoFocus /></div>
                <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
                  <input className="f-input" value={dossierForm.imageUrl} onChange={e => setDossierForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
              </div>
              <div className="f-group"><label className="f-label">Backstory</label>
                <RichEditor value={dossierForm.backstory} onChange={v => setDossierForm(f=>({...f,backstory:v}))} placeholder="Hintergrundgeschichte des Charakters..." rows={4} /></div>
              <div className="f-group"><label className="f-label">Geheime Plot-Fäden & Hooks</label>
                <RichEditor value={dossierForm.threads} onChange={v => setDossierForm(f=>({...f,threads:v}))} placeholder="Welche Fäden ziehst du für diesen PC? Welche Geheimnisse warten?" rows={4} /></div>
              <div className="f-group"><label className="f-label">Beziehungen (NPCs & andere PCs)</label>
                <RichEditor value={dossierForm.relationships} onChange={v => setDossierForm(f=>({...f,relationships:v}))} placeholder="Wichtige Verbindungen, Rivalen, Verbündete..." rows={3} /></div>
              <div className="f-group"><label className="f-label">Arc-Notizen (Wohin geht die Reise?)</label>
                <RichEditor value={dossierForm.arc} onChange={v => setDossierForm(f=>({...f,arc:v}))} placeholder="Wo soll dieser Charakter hin? Welche Entwicklung planst du?" rows={3} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={saveDossier} disabled={!dossierForm.name.trim()}>{editingDossier ? "Speichern" : "Dossier anlegen"}</button>
                <button className="btn-secondary" onClick={() => { setShowDossierForm(false); setEditingDossier(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {pcDossiers.length === 0
            ? <div className="empty">Noch keine PC Dossiers.<br /><span style={{fontSize:"0.85rem"}}>Leg deine Spielercharaktere an. 👤</span></div>
            : pcDossiers.map(d => {
              const isOpen = expandedDossier === d.id;
              const secState = expandedDossierSection[d.id] || {};
              const sections = [
                { key: "backstory",      label: "Backstory",         icon: "📜", color: "#c094c8", content: d.backstory },
                { key: "threads",        label: "Plot-Fäden & Hooks",icon: "🕸", color: "#e8c878", content: d.threads },
                { key: "relationships",  label: "Beziehungen",       icon: "🤝", color: "#94a8d8", content: d.relationships },
                { key: "arc",            label: "Arc-Notizen",       icon: "🌟", color: "#94c8a8", content: d.arc },
              ];
              return (
                <div key={d.id} className="dossier-card">
                  <div className="dossier-header" onClick={() => setExpandedDossier(isOpen ? null : d.id)}>
                    <div className="dossier-avatar">
                      {d.imageUrl ? <img src={d.imageUrl} alt={d.name} onError={e => { e.target.style.display="none"; }} /> : "👤"}
                    </div>
                    <div style={{flex:1}}>
                      <p className="dossier-pc-name">{d.name}</p>
                      <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.4rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0",margin:"0.1rem 0 0"}}>
                        {sections.filter(s => s.content).length} / {sections.length} Sektionen ausgefüllt
                      </p>
                    </div>
                    <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                      <button className="card-act-edit" onClick={e => { e.stopPropagation(); startEditDossier(d); }}>✎</button>
                      <button className="btn-danger" onClick={e => { e.stopPropagation(); if(window.confirm(`${d.name} löschen?`)) upd(pcDossiers.filter(x=>x.id!==d.id)); }}>✕</button>
                      <span className={`card-chevron ${isOpen ? "open" : ""}`}>▼</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="dossier-body">
                      {sections.map(sec => {
                        const secOpen = secState[sec.key];
                        return (
                          <div key={sec.key}>
                            <button className="dossier-section-btn"
                              onClick={() => setExpandedDossierSection(s => ({...s, [d.id]: {...(s[d.id]||{}), [sec.key]: !secOpen}}))} >
                              <span className="dossier-section-label" style={{color: sec.color}}>
                                <span>{sec.icon}</span>{sec.label}
                                {!sec.content && <span style={{fontSize:"0.38rem",opacity:0.5,fontWeight:400,letterSpacing:"0.05em"}}>(leer)</span>}
                              </span>
                              <span className={`dossier-section-chevron ${secOpen ? "open" : ""}`}>▼</span>
                            </button>
                            {secOpen && (
                              <div className="dossier-section-content">
                                {sec.content
                                  ? <div className="narrative" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                  : <p style={{fontFamily:"'IM Fell English',serif",fontStyle:"italic",color:"#c0a8d0",fontSize:"0.85rem"}}>Noch nichts eingetragen. Bearbeite das Dossier um Inhalt hinzuzufügen.</p>
                                }
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}

      {/* ── WELTENARCHIV ── */}
      {gmPlanTab === "world" && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
            <button className="btn-add" onClick={() => { setShowWorldForm(v => !v); setEditingWorld(null); setWorldForm({ title:"", text:"", type:"ort", imageUrl:"" }); }}>+ Neuer Eintrag</button>
          </div>

          {showWorldForm && (
            <div className="form-panel">
              <p className="form-title">{editingWorld ? "Eintrag bearbeiten" : "Neuer Weltenarchiv-Eintrag"}</p>
              <div className="f-group"><label className="f-label">Typ</label>
                <div className="world-filter-row">
                  {[
                    { id: "ort",    label: "Ort / Karte",       icon: "🗺", color: "#94c8a8" },
                    { id: "wissen", label: "Wissen / Lore",     icon: "📚", color: "#c094c8" },
                    { id: "regel",  label: "Hausregel",         icon: "⚖",  color: "#e8c878" },
                    { id: "fraktion",label: "Fraktion / Gruppe",icon: "🏴", color: "#94a8d8" },
                  ].map(t => (
                    <span key={t.id} className={`world-filter-btn ${worldForm.type === t.id ? "active" : ""}`}
                      onClick={() => setWorldForm(f=>({...f,type:t.id}))}>{t.icon} {t.label}</span>
                  ))}
                </div>
              </div>
              <div className="f-group"><label className="f-label">Titel</label>
                <input className="f-input" value={worldForm.title} onChange={e => setWorldForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Die Mondblumenlichtung" autoFocus /></div>
              <div className="f-group"><label className="f-label">Inhalt</label>
                <RichEditor value={worldForm.text} onChange={v => setWorldForm(f=>({...f,text:v}))} placeholder="Beschreibung, Regeln, Lore..." rows={6} /></div>
              <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
                <input className="f-input" value={worldForm.imageUrl} onChange={e => setWorldForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={saveWorldEntry} disabled={!worldForm.title.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowWorldForm(false); setEditingWorld(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {(() => {
            const WORLD_TYPES = [
              { id: "all",      label: "Alle",             icon: "✦",  color: "#8a6aaa" },
              { id: "ort",      label: "Orte",             icon: "🗺", color: "#94c8a8" },
              { id: "wissen",   label: "Wissen",           icon: "📚", color: "#c094c8" },
              { id: "regel",    label: "Hausregeln",       icon: "⚖",  color: "#e8c878" },
              { id: "fraktion", label: "Fraktionen",       icon: "🏴", color: "#94a8d8" },
            ];
            const filtered = worldFilter === "all" ? worldEntries : worldEntries.filter(w => w.type === worldFilter);
            return (
              <>
                {worldEntries.length > 0 && (
                  <div className="world-filter-row">
                    {WORLD_TYPES.map(t => {
                      const count = t.id === "all" ? worldEntries.length : worldEntries.filter(w => w.type === t.id).length;
                      if (t.id !== "all" && count === 0) return null;
                      return (
                        <span key={t.id} className={`world-filter-btn ${worldFilter === t.id ? "active" : ""}`}
                          onClick={() => setWorldFilter(t.id)}>{t.icon} {t.label} ({count})</span>
                      );
                    })}
                  </div>
                )}

                {/* Expanded world detail */}
                {expandedWorld && (() => {
                  const w = worldEntries.find(x => x.id === expandedWorld);
                  if (!w) return null;
                  const wtype = WORLD_TYPES.find(t => t.id === w.type);
                  return (
                    <div className="world-detail">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.6rem"}}>
                        <div>
                          <span className="world-type-badge" style={{color:wtype?.color||"#c094c8",borderColor:wtype?.color||"#c094c8",marginBottom:"0.3rem"}}>
                            {wtype?.icon} {wtype?.label}
                          </span>
                          <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",fontWeight:700,fontStyle:"italic",color:"#3a1858",margin:"0.3rem 0 0.15rem"}}>{w.title}</p>
                          <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.4rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(w.ts)}</p>
                        </div>
                        <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                          <button className="card-act-edit" onClick={() => { setWorldForm({title:w.title,text:w.text||"",type:w.type,imageUrl:w.imageUrl||""}); setEditingWorld(w.id); setShowWorldForm(true); setExpandedWorld(null); }}>✎</button>
                          <button className="btn-danger" onClick={() => { uwe(worldEntries.filter(x=>x.id!==w.id)); setExpandedWorld(null); }}>✕</button>
                          <button className="btn-danger" onClick={() => setExpandedWorld(null)}>✕</button>
                        </div>
                      </div>
                      {w.imageUrl && <img src={w.imageUrl} alt={w.title} style={{width:"100%",maxHeight:"220px",objectFit:"contain",borderRadius:"8px",marginBottom:"0.8rem",background:"#f8f0fc",display:"block"}} onError={e => e.target.style.display="none"} />}
                      {w.text && <div className="narrative" dangerouslySetInnerHTML={{ __html: w.text }} />}
                    </div>
                  );
                })()}

                {filtered.length === 0
                  ? <div className="empty">Noch keine Einträge im Weltenarchiv.<br /><span style={{fontSize:"0.85rem"}}>Orte, Lore, Hausregeln — dein Weltenbau. 🌍</span></div>
                  : filtered.map(w => {
                    const wtype = WORLD_TYPES.find(t => t.id === w.type);
                    return (
                      <div key={w.id} className="world-card" onClick={() => setExpandedWorld(expandedWorld === w.id ? null : w.id)}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.5rem"}}>
                          <div>
                            <span className="world-type-badge" style={{color:wtype?.color||"#c094c8",borderColor:wtype?.color||"#c094c8"}}>
                              {wtype?.icon} {wtype?.label}
                            </span>
                            <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.06em",color:"#3a1858",margin:"0.3rem 0 0.1rem"}}>{w.title}</p>
                            <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.38rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(w.ts)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </>
            );
          })()}
        </>
      )}

      {/* ── QUICK NOTES ── */}
      {gmPlanTab === "quick" && (
        <>
          <div className="form-panel" style={{marginBottom:"1rem"}}>
            <p className="form-title">{editingQn ? "Notiz bearbeiten" : "📝 Schnelle Notiz"}</p>
            <div className="qn-input-row">
              <input className="f-input" value={qnForm.text}
                onChange={e => setQnForm(f=>({...f,text:e.target.value}))}
                onKeyDown={e => e.key === "Enter" && addQuickNote()}
                placeholder="Was darfst du nicht vergessen?" autoFocus />
              <input className="f-input" style={{maxWidth:"120px"}} value={qnForm.tag}
                onChange={e => setQnForm(f=>({...f,tag:e.target.value}))}
                onKeyDown={e => e.key === "Enter" && addQuickNote()}
                placeholder="Tag (opt.)" />
              <button className="btn-primary" onClick={addQuickNote} disabled={!qnForm.text.trim()} style={{whiteSpace:"nowrap"}}>{editingQn ? "✓" : "+"}</button>
              {editingQn && <button className="btn-secondary" onClick={() => { setEditingQn(null); setQnForm({text:"",tag:""}); }} style={{whiteSpace:"nowrap"}}>✕</button>}
            </div>
          </div>

          {quickNotes.length === 0
            ? <div className="empty">Keine Quick Notes.<br /><span style={{fontSize:"0.85rem"}}>Schnell was notieren, erledigt abhaken. 📝</span></div>
            : <>
              {/* Active notes */}
              {quickNotes.filter(n=>!n.done).length > 0 && (
                <div style={{marginBottom:"1rem"}}>
                  {quickNotes.filter(n=>!n.done).map(n => (
                    <div key={n.id} className="qn-card">
                      <div className={`qn-checkbox`} onClick={() => toggleQuickNote(n.id)}>
                        &nbsp;
                      </div>
                      <div style={{flex:1}}>
                        <p className="qn-text">{n.text}</p>
                        <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginTop:"0.2rem",flexWrap:"wrap"}}>
                          {n.tag && <span className="qn-tag">{n.tag}</span>}
                          <span className="qn-date">{formatDate(n.ts)}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"0.2rem",flexShrink:0}}>
                        <button className="card-act-edit" onClick={() => { setQnForm({text:n.text,tag:n.tag||""}); setEditingQn(n.id); }}>✎</button>
                        <button className="btn-danger" onClick={() => uqn(quickNotes.filter(x=>x.id!==n.id))}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Done notes */}
              {quickNotes.filter(n=>n.done).length > 0 && (
                <div>
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.45rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.4rem"}}>✓ Erledigt ({quickNotes.filter(n=>n.done).length})</p>
                  {quickNotes.filter(n=>n.done).map(n => (
                    <div key={n.id} className="qn-card done">
                      <div className="qn-checkbox checked" onClick={() => toggleQuickNote(n.id)}>✓</div>
                      <div style={{flex:1}}>
                        <p className="qn-text">{n.text}</p>
                        <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginTop:"0.2rem",flexWrap:"wrap"}}>
                          {n.tag && <span className="qn-tag">{n.tag}</span>}
                          <span className="qn-date">{formatDate(n.ts)}</span>
                        </div>
                      </div>
                      <button className="btn-danger" onClick={() => uqn(quickNotes.filter(x=>x.id!==n.id))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          }
        </>
      )}

      {/* ── LEGACY NOTES ── */}
      {gmPlanTab === "legacy" && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"0.8rem"}}>
            <button className="btn-add" onClick={() => { setShowGmNoteForm(v => !v); setEditingGmNote(null); setGmNoteForm({ title: "", text: "", category: "plan" }); }}>+ Neue Notiz</button>
          </div>

          {showGmNoteForm && (
            <div className="form-panel">
              <p className="form-title">{editingGmNote ? "Notiz bearbeiten" : "Neue GM-Notiz"}</p>
              <div className="f-group">
                <label className="f-label">Kategorie</label>
                <div className="cat-picker">
                  {GM_CATEGORIES.map(c => (
                    <span key={c.id} className={`cat-opt ${gmNoteForm.category === c.id ? "selected" : ""}`}
                      onClick={() => setGmNoteForm(f => ({...f, category: c.id}))}>
                      {c.icon} {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="f-group"><label className="f-label">Titel</label>
                <input className="f-input" value={gmNoteForm.title} onChange={e => setGmNoteForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Session 5 Vorbereitung" autoFocus /></div>
              <div className="f-group"><label className="f-label">Inhalt</label>
                <RichEditor value={gmNoteForm.text} onChange={v => setGmNoteForm(f=>({...f,text:v}))} placeholder="Deine Planungsnotizen, Geheimnisse, NPC-Details..." rows={6} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={saveGmNote} disabled={!gmNoteForm.title.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowGmNoteForm(false); setEditingGmNote(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1rem"}}>
            {GM_CATEGORIES.map(c => {
              const count = gmNotes.filter(n => n.category === c.id).length;
              if (!count) return null;
              return (
                <span key={c.id} style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.2rem 0.5rem",borderRadius:"3px",border:`1px solid ${c.color}`,color:c.color,display:"flex",alignItems:"center",gap:"0.2rem"}}>
                  {c.icon} {c.label} ({count})
                </span>
              );
            })}
          </div>

          {gmNotes.length === 0
            ? <div className="empty">Noch keine GM-Notizen.<br /><span style={{fontSize:"0.85rem"}}>Nur du kannst das hier sehen. 🔐</span></div>
            : GM_CATEGORIES.map(cat => {
              const group = gmNotes.filter(n => n.category === cat.id);
              if (!group.length) return null;
              return (
                <div key={cat.id} style={{marginBottom:"1.2rem"}}>
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:cat.color,marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:"0.3rem"}}>{cat.icon} {cat.label}</p>
                  {group.map(n => {
                    const isOpen = expandedGmNote === n.id;
                    return (
                      <div key={n.id} className="gm-note-card">
                        <div style={{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"}} onClick={() => setExpandedGmNote(isOpen ? null : n.id)}>
                          <div style={{flex:1}}>
                            <p style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",fontWeight:700,color:"#5a3878",margin:"0 0 0.15rem"}}>{n.title}</p>
                            <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#c0a8d0"}}>{formatDate(n.ts)}</p>
                          </div>
                          <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                            <button className="card-act-edit" onClick={e => { e.stopPropagation(); setGmNoteForm({title:n.title,text:n.text,category:n.category}); setEditingGmNote(n.id); setShowGmNoteForm(true); setExpandedGmNote(null); }}>✎</button>
                            <button className="btn-danger" onClick={e => { e.stopPropagation(); ugn(gmNotes.filter(x => x.id !== n.id)); }}>✕</button>
                            <span style={{color:"#d8c8e8",fontSize:"0.7rem",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"none"}}>▼</span>
                          </div>
                        </div>
                        {isOpen && n.text && (
                          <div style={{marginTop:"0.8rem",paddingTop:"0.8rem",borderTop:"1px solid #f0e4f8"}}>
                            <div className="narrative" dangerouslySetInnerHTML={{ __html: n.text }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}

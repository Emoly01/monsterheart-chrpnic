import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { PAKT_TYPES, PAKT_STATUSES, paktType, paktStatus, sortPakte, makeId } from "../constants.js";

const PAKT_FORM_DEFAULT = { titel: "", typ: "deal", parteien: "", wortlaut: "", bedingungen: "", status: "offen", session: "", npc: "", visibleToPlayers: false };

export default function PakteTab({ gmMode, pakte, up }) {
  const [paktForm, setPaktForm] = useState(PAKT_FORM_DEFAULT);
  const [showPaktForm, setShowPaktForm] = useState(false);
  const [editingPakt, setEditingPakt] = useState(null);
  const [paktTypeFilter, setPaktTypeFilter] = useState("all");
  const [paktStatusFilter, setPaktStatusFilter] = useState("all");
  const [paktSearch, setPaktSearch] = useState("");

  const savePakt = () => {
    if (!paktForm.titel.trim()) return;
    if (editingPakt) {
      up(pakte.map(p => p.id === editingPakt ? { ...p, ...paktForm, titel: paktForm.titel.trim() } : p));
      setEditingPakt(null);
    } else {
      up([{ id: makeId(), ...paktForm, titel: paktForm.titel.trim(), ts: Date.now() }, ...pakte]);
    }
    setPaktForm(PAKT_FORM_DEFAULT); setShowPaktForm(false);
  };
  const startEditPakt = (p) => {
    setPaktForm({
      titel: p.titel || "", typ: p.typ || "deal", parteien: p.parteien || "",
      wortlaut: p.wortlaut || "", bedingungen: p.bedingungen || "", status: p.status || "offen",
      session: p.session || "", npc: p.npc || "", visibleToPlayers: !!p.visibleToPlayers,
    });
    setEditingPakt(p.id); setShowPaktForm(true);
  };
  const cyclePaktStatus = (id) => {
    up(pakte.map(p => {
      if (p.id !== id) return p;
      const i = PAKT_STATUSES.findIndex(s => s.id === (p.status || "offen"));
      return { ...p, status: PAKT_STATUSES[(i + 1) % PAKT_STATUSES.length].id };
    }));
  };
  const deletePakt = (id) => {
    if (window.confirm("Diesen Pakt wirklich löschen?")) up(pakte.filter(p => p.id !== id));
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🤝 Pakte & Versprechen</p>
        {gmMode && <button className="btn-add" onClick={() => { setShowPaktForm(v => !v); setEditingPakt(null); setPaktForm(PAKT_FORM_DEFAULT); }}>+ Pakt hinzufügen</button>}
      </div>

      {gmMode && showPaktForm && (
        <div className="form-panel">
          <p className="form-title">{editingPakt ? "Pakt bearbeiten" : "Neuer Pakt"}</p>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Typ</label>
              <select className="f-select" value={paktForm.typ} onChange={e => setPaktForm(f=>({...f,typ:e.target.value}))}>
                {PAKT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div className="f-group"><label className="f-label">Titel</label>
              <input className="f-input" value={paktForm.titel} onChange={e => setPaktForm(f=>({...f,titel:e.target.value}))} placeholder="z.B. Der Handel mit Zybilna" autoFocus /></div>
          </div>
          <div className="f-group"><label className="f-label">Parteien — Wer schuldet wem?</label>
            <input className="f-input" value={paktForm.parteien} onChange={e => setPaktForm(f=>({...f,parteien:e.target.value}))} placeholder="z.B. Zybilna → Gruppe" /></div>
          <div className="f-group"><label className="f-label">📜 Genauer Wortlaut</label>
            <RichEditor value={paktForm.wortlaut} onChange={v => setPaktForm(f=>({...f,wortlaut:v}))} placeholder="Der exakte Wortlaut des Handels — jedes Wort zählt..." rows={4} /></div>
          <div className="f-group"><label className="f-label" style={{color:"#c094c8"}}>🔐 Bedingungen / Schlupflöcher (nur GM)</label>
            <RichEditor value={paktForm.bedingungen} onChange={v => setPaktForm(f=>({...f,bedingungen:v}))} placeholder="Versteckte Klauseln, Auswege, Fallen..." rows={3} /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Status</label>
              <select className="f-select" value={paktForm.status} onChange={e => setPaktForm(f=>({...f,status:e.target.value}))}>
                {PAKT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="f-group"><label className="f-label">Session / Datum</label>
              <input className="f-input" value={paktForm.session} onChange={e => setPaktForm(f=>({...f,session:e.target.value}))} placeholder="z.B. Sitzung 7 — 12.03." /></div>
          </div>
          <div className="f-group"><label className="f-label">Verknüpfter NPC (optional)</label>
            <input className="f-input" value={paktForm.npc} onChange={e => setPaktForm(f=>({...f,npc:e.target.value}))} placeholder="z.B. Zybilna" /></div>
          <label className="pakt-vis-check">
            <input type="checkbox" checked={paktForm.visibleToPlayers} onChange={e => setPaktForm(f=>({...f,visibleToPlayers:e.target.checked}))} />
            <span>👁 Für Spieler sichtbar</span>
          </label>
          <div className="f-actions">
            <button className="btn-primary" onClick={savePakt} disabled={!paktForm.titel.trim()}>Speichern</button>
            <button className="btn-secondary" onClick={() => { setShowPaktForm(false); setEditingPakt(null); }}>Abbrechen</button>
          </div>
        </div>
      )}

      {pakte.length > 0 && (
        <>
          <div className="npc-controls-row">
            <div className="npc-search-wrap">
              <span className="npc-search-icon">🔍</span>
              <input className="npc-search-input" value={paktSearch} onChange={e => setPaktSearch(e.target.value)}
                placeholder="Titel, Parteien, Wortlaut durchsuchen..." />
            </div>
          </div>
          <div className="pakt-filter-row">
            <button className={`pakt-filter-btn ${paktTypeFilter==="all"?"active":""}`} onClick={()=>setPaktTypeFilter("all")}>Alle Typen</button>
            {PAKT_TYPES.map(t => (
              <button key={t.id} className={`pakt-filter-btn ${paktTypeFilter===t.id?"active":""}`}
                style={paktTypeFilter===t.id?{color:t.color,borderColor:t.color}:{}} onClick={()=>setPaktTypeFilter(t.id)}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div className="pakt-filter-row">
            <button className={`pakt-filter-btn ${paktStatusFilter==="all"?"active":""}`} onClick={()=>setPaktStatusFilter("all")}>Alle Status</button>
            {PAKT_STATUSES.map(s => (
              <button key={s.id} className={`pakt-filter-btn ${paktStatusFilter===s.id?"active":""}`}
                style={paktStatusFilter===s.id?{color:s.color,borderColor:s.color}:{}} onClick={()=>setPaktStatusFilter(s.id)}>{s.label}</button>
            ))}
          </div>
        </>
      )}

      {(() => {
        const base = gmMode ? pakte : pakte.filter(p => p.visibleToPlayers);
        if (base.length === 0) return (
          <div className="empty">
            {pakte.length === 0
              ? <>Noch keine Pakte festgehalten.<br /><span style={{fontSize:"0.85rem"}}>Jeder Feenhandel beginnt mit einem Wort... 🤝</span></>
              : <>Noch keine für Spieler sichtbaren Pakte.<br /><span style={{fontSize:"0.85rem"}}>Die Abmachungen bleiben vorerst verborgen. ✦</span></>}
          </div>
        );
        const q = paktSearch.toLowerCase().trim();
        const filtered = base.filter(p => {
          const typeMatch = paktTypeFilter === "all" || (p.typ||"deal") === paktTypeFilter;
          const statusMatch = paktStatusFilter === "all" || (p.status||"offen") === paktStatusFilter;
          const searchMatch = !q
            || (p.titel||"").toLowerCase().includes(q)
            || (p.parteien||"").toLowerCase().includes(q)
            || (p.wortlaut||"").replace(/<[^>]*>/g," ").toLowerCase().includes(q);
          return typeMatch && statusMatch && searchMatch;
        });
        const sorted = sortPakte(filtered);
        if (sorted.length === 0) return (
          <div className="empty" style={{paddingTop:"1.5rem"}}>
            Keine Pakte gefunden.<br /><span style={{fontSize:"0.85rem"}}>Versuch andere Filter oder eine andere Suche. ✦</span>
          </div>
        );
        return sorted.map(p => {
          const t = paktType(p.typ);
          const st = paktStatus(p.status);
          const faded = (p.status||"offen") !== "offen";
          return (
            <div key={p.id} className={`pakt-card ${faded ? "faded" : ""}`} style={{borderLeftColor: t.color}}>
              <div className="pakt-card-top">
                <div className="pakt-badges">
                  <span className="tag" style={{color:t.color,borderColor:t.color}}>{t.icon} {t.label}</span>
                  {gmMode
                    ? <button className="pakt-status-badge tag" style={{color:st.color,borderColor:st.color}} onClick={()=>cyclePaktStatus(p.id)} title="Status wechseln (klicken)">{st.label} ⟳</button>
                    : <span className="tag" style={{color:st.color,borderColor:st.color}}>{st.label}</span>}
                  {gmMode && <span className="pakt-eye" title={p.visibleToPlayers?"Für Spieler sichtbar":"Nur für GM"}>{p.visibleToPlayers?"👁":"🚫"}</span>}
                </div>
                {gmMode && (
                  <div className="pakt-card-actions">
                    <button className="card-act-edit" onClick={()=>startEditPakt(p)}>✎</button>
                    <button className="btn-danger" onClick={()=>deletePakt(p.id)}>✕</button>
                  </div>
                )}
              </div>
              <p className="pakt-title">{p.titel}</p>
              {p.parteien && <p className="pakt-parteien">{p.parteien}</p>}
              {p.wortlaut && (
                <div className="pakt-wortlaut">
                  <span className="pakt-wortlaut-mark">❝</span>
                  <div className="narrative" dangerouslySetInnerHTML={{ __html: p.wortlaut }} />
                </div>
              )}
              {gmMode && p.bedingungen && (
                <div className="pakt-bedingungen">
                  <p className="pakt-bedingungen-label">🔐 Bedingungen / Schlupflöcher</p>
                  <div className="narrative" dangerouslySetInnerHTML={{ __html: p.bedingungen }} />
                </div>
              )}
              {(p.session || p.npc) && (
                <p className="pakt-meta">
                  {p.session ? p.session : ""}{p.session && p.npc ? " · " : ""}{p.npc ? `👤 ${p.npc}` : ""}
                </p>
              )}
            </div>
          );
        });
      })()}
    </div>
  );
}

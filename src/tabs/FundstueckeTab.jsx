import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { FUND_TYPES, makeId, formatDate } from "../constants.js";

export default function FundstueckeTab({ gmMode, fundstucke, uf }) {
  const [fundForm, setFundForm] = useState({ type: "brief", title: "", text: "", imageUrl: "" });
  const [showFundForm, setShowFundForm] = useState(false);
  const [expandedFund, setExpandedFund] = useState(null);

  const addFund = () => {
    if (!fundForm.title.trim()) return;
    uf([{ id: makeId(), ...fundForm, ts: Date.now() }, ...fundstucke]);
    setFundForm({ type: "brief", title: "", text: "", imageUrl: "" });
    setShowFundForm(false);
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🔍 Fundstücke</p>
        {gmMode && <button className="btn-add" onClick={() => setShowFundForm(v => !v)}>+ Hinzufügen</button>}
      </div>
      {gmMode && showFundForm && (
        <div className="form-panel">
          <p className="form-title">Neues Fundstück</p>
          <div className="f-group">
            <label className="f-label">Typ</label>
            <div className="fund-type-picker">
              {FUND_TYPES.map(t => (
                <span key={t.id} className={`fund-type-opt ${fundForm.type === t.id ? "selected" : ""}`}
                  onClick={() => setFundForm(f => ({...f, type: t.id}))}>{t.icon} {t.label}</span>
              ))}
            </div>
          </div>
          <div className="f-group"><label className="f-label">Titel</label>
            <input className="f-input" value={fundForm.title} onChange={e => setFundForm(f => ({...f, title: e.target.value}))} placeholder="z.B. Brief von Isolde..." autoFocus /></div>
          <div className="f-group"><label className="f-label">Inhalt</label>
            <RichEditor value={fundForm.text} onChange={v => setFundForm(f => ({...f, text: v}))} placeholder="Der Text des Briefes, die Beschreibung des Artefakts..." rows={5} /></div>
          <div className="f-group"><label className="f-label">Bild-URL (optional)</label>
            <input className="f-input" value={fundForm.imageUrl} onChange={e => setFundForm(f => ({...f, imageUrl: e.target.value}))} placeholder="https://i.imgur.com/..." /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={addFund} disabled={!fundForm.title.trim()}>Speichern</button>
            <button className="btn-secondary" onClick={() => setShowFundForm(false)}>Abbrechen</button>
          </div>
        </div>
      )}
      {expandedFund && (() => {
        const item = fundstucke.find(x => x.id === expandedFund);
        if (!item) return null;
        const ftype = FUND_TYPES.find(t => t.id === item.type);
        return (
          <div className="fund-detail">
            <div className="fund-detail-hdr">
              <div>
                <p className="fund-detail-title">{item.title}</p>
                <p className="fund-detail-meta">{ftype?.icon} {ftype?.label} · {formatDate(item.ts)}</p>
              </div>
              <div style={{display:"flex",gap:"0.4rem",flexShrink:0,alignItems:"center"}}>
                {gmMode && (
                  <button className="btn-danger" onClick={() => { uf(fundstucke.filter(x => x.id !== item.id)); setExpandedFund(null); }}>✕ Löschen</button>
                )}
                <button className="btn-danger" onClick={() => setExpandedFund(null)}>✕</button>
              </div>
            </div>
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="fund-detail-img" onError={e => e.target.style.display="none"} />}
            {item.text && <div className="fund-detail-text narrative" dangerouslySetInnerHTML={{ __html: item.text }} />}
          </div>
        );
      })()}
      {fundstucke.length === 0
        ? <div className="empty">Noch keine Fundstücke.<br /><span style={{fontSize:"0.85rem"}}>Briefe, Tagebücher, Artefakte — alles was sie finden. 🔍</span></div>
        : <div className="fund-grid">
          {fundstucke.map(item => {
            const ftype = FUND_TYPES.find(t => t.id === item.type);
            const plainText = item.text?.replace(/<[^>]+>/g, "") || "";
            return (
              <div key={item.id} className="fund-card" onClick={() => setExpandedFund(expandedFund === item.id ? null : item.id)}>
                <div className="fund-card-top">
                  <span className="fund-icon">{ftype?.icon}</span>
                  <span className="fund-card-name">{item.title}</span>
                </div>
                <span className="fund-type-label">{ftype?.label}</span>
                {plainText && <p className="fund-preview">{plainText}</p>}
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

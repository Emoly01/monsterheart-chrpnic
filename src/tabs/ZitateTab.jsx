import { useState } from "react";
import { makeId } from "../constants.js";

export default function ZitateTab({ gmMode, playerName, quotes, uqt }) {
  const [quoteForm, setQuoteForm] = useState({ speaker: "", text: "" });
  const [editingQuote, setEditingQuote] = useState(null);
  const [editingQuoteText, setEditingQuoteText] = useState("");

  const addQuote = () => {
    if (!quoteForm.text.trim()) return;
    uqt([{ id: makeId(), speaker: quoteForm.speaker.trim() || (playerName || "Unbekannt"), text: quoteForm.text.trim(), ts: Date.now() }, ...quotes]);
    setQuoteForm({ speaker: "", text: "" });
  };

  const saveQuote = (quoteId) => {
    if (!editingQuoteText.trim()) return;
    uqt(quotes.map(q => q.id === quoteId ? { ...q, text: editingQuoteText.trim() } : q));
    setEditingQuote(null);
    setEditingQuoteText("");
  };

  return (
    <div className="page">
      <div className="section-hdr"><p className="section-title">❝ Zitate</p></div>
      <div className="form-panel">
        <p className="form-title">Zitat hinzufügen</p>
        <div className="f-row">
          <div className="f-group"><label className="f-label">Wer?</label>
            <input className="f-input" value={quoteForm.speaker} onChange={e => setQuoteForm(f=>({...f,speaker:e.target.value}))} placeholder={playerName || "Charakter"} /></div>
          <div className="f-group"><label className="f-label">Was wurde gesagt?</label>
            <input className="f-input" value={quoteForm.text} onChange={e => setQuoteForm(f=>({...f,text:e.target.value}))} placeholder="Das unvergessliche Zitat..."
              onKeyDown={e => e.key === "Enter" && addQuote()} /></div>
        </div>
        <button className="btn-primary" onClick={addQuote} disabled={!quoteForm.text.trim()}>Hinzufügen</button>
      </div>
      {quotes.length === 0
        ? <div className="empty">Noch keine Zitate gesammelt.<br /><span style={{fontSize:"0.85rem"}}>Die erste denkwürdige Aussage wartet. ❝</span></div>
        : <div className="quotes-grid">
          {quotes.map(q => {
            const canEdit = gmMode || q.speaker === playerName;
            const isEditing = editingQuote === q.id;
            return (
              <div key={q.id} className="quote-card">
                {canEdit && (
                  <div className="quote-actions">
                    {!isEditing && (
                      <button className="quote-edit-btn" title="Bearbeiten"
                        onClick={() => { setEditingQuote(q.id); setEditingQuoteText(q.text); }}>✎</button>
                    )}
                    <button className="quote-del" title="Löschen"
                      onClick={() => { if(isEditing) { setEditingQuote(null); setEditingQuoteText(""); } uqt(quotes.filter(x => x.id !== q.id)); }}>✕</button>
                  </div>
                )}
                <span className="quote-mark">❝</span>
                {isEditing ? (
                  <>
                    <textarea className="quote-edit-input" value={editingQuoteText}
                      onChange={e => setEditingQuoteText(e.target.value)}
                      onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveQuote(q.id); } if(e.key === "Escape") { setEditingQuote(null); setEditingQuoteText(""); } }}
                      autoFocus />
                    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.4rem"}}>
                      <button className="btn-tiny btn-tiny-primary" onClick={() => saveQuote(q.id)} disabled={!editingQuoteText.trim()}>✓ Speichern</button>
                      <button className="btn-tiny btn-tiny-secondary" onClick={() => { setEditingQuote(null); setEditingQuoteText(""); }}>Abbrechen</button>
                    </div>
                  </>
                ) : (
                  <p className="quote-text">{q.text}</p>
                )}
                <p className="quote-speaker">— {q.speaker}</p>
                {q.sitzung ? <p style={{fontFamily:"'Spectral', serif",fontStyle:"italic",fontSize:"0.8rem",color:"#9aa89c",margin:"0.25rem 0 0",textAlign:"right"}}>{q.sitzung.split("-").reverse().join(".")}</p> : null}
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId, formatDate } from "../constants.js";

export default function GeschichtenTab({ gmMode, playerName, snippets, usn }) {
  const [snippetForm, setSnippetForm] = useState({ title: "", text: "" });
  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [playerSnippetForm, setPlayerSnippetForm] = useState({ title: "", text: "" });
  const [showPlayerSnippetForm, setShowPlayerSnippetForm] = useState(false);

  const addSnippet = () => {
    if (!snippetForm.text.trim()) return;
    usn([{ id: makeId(), title: snippetForm.title.trim(), text: snippetForm.text, ts: Date.now(), author: "GM" }, ...snippets]);
    setSnippetForm({ title: "", text: "" }); setShowSnippetForm(false);
  };

  const addPlayerSnippet = () => {
    if (!playerSnippetForm.text.trim() || !playerName) return;
    usn([{ id: makeId(), title: playerSnippetForm.title.trim(), text: playerSnippetForm.text, ts: Date.now(), author: playerName }, ...snippets]);
    setPlayerSnippetForm({ title: "", text: "" }); setShowPlayerSnippetForm(false);
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <div className="section-head">
          <div className="eyebrow">Kampagne · Iere</div>
          <h1 className="section-title">Snippets</h1>
          <p className="section-sub">Regeln, Orte und lose Notizen — griffbereit für die nächste Sitzung.</p>
        </div>
        <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
          {playerName && <button className="btn-add" onClick={() => { setShowPlayerSnippetForm(v => !v); setShowSnippetForm(false); }}>+ Deine Geschichte</button>}
          {gmMode && <button className="btn-add" onClick={() => { setShowSnippetForm(v => !v); setShowPlayerSnippetForm(false); }}>+ GM Snippet</button>}
        </div>
      </div>

      {showPlayerSnippetForm && playerName && (
        <div className="form-panel">
          <p className="form-title">Deine Geschichte — {playerName}</p>
          <div className="f-group"><label className="f-label">Titel (optional)</label>
            <input className="f-input" value={playerSnippetForm.title} onChange={e => setPlayerSnippetForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Eyas Tagebuch" autoFocus /></div>
          <div className="f-group"><label className="f-label">Text</label>
            <RichEditor value={playerSnippetForm.text} onChange={v => setPlayerSnippetForm(f=>({...f,text:v}))} placeholder="Dein Prosa-Snippet, Tagebucheintrag, Gedanke..." rows={6} /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={addPlayerSnippet} disabled={!playerSnippetForm.text.trim()}>Veröffentlichen</button>
            <button className="btn-secondary" onClick={() => setShowPlayerSnippetForm(false)}>Abbrechen</button>
          </div>
        </div>
      )}

      {gmMode && showSnippetForm && (
        <div className="form-panel">
          <p className="form-title">Neues GM Story-Snippet</p>
          <div className="f-group"><label className="f-label">Titel (optional)</label>
            <input className="f-input" value={snippetForm.title} onChange={e => setSnippetForm(f=>({...f,title:e.target.value}))} placeholder="z.B. Im Mondlicht" autoFocus /></div>
          <div className="f-group"><label className="f-label">Text</label>
            <RichEditor value={snippetForm.text} onChange={v => setSnippetForm(f=>({...f,text:v}))} placeholder="Dein Prosa-Snippet, Szene, Gedanke..." rows={7} /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={addSnippet} disabled={!snippetForm.text.trim()}>Posten</button>
            <button className="btn-secondary" onClick={() => setShowSnippetForm(false)}>Abbrechen</button>
          </div>
        </div>
      )}

      {snippets.length === 0
        ? <div className="empty">Noch keine Geschichten geschrieben.<br /><span style={{fontSize:"0.85rem"}}>Die Feder wartet... 🌙</span></div>
        : snippets.map(s => (
          <div key={s.id} className="snippet-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.3rem"}}>
              <div>
                {s.title && <p className="snippet-title">{s.title}</p>}
                <p className="snippet-author">{s.author || "GM"}</p>
              </div>
              {(gmMode || s.author === playerName) && <button className="btn-danger" onClick={() => usn(snippets.filter(x => x.id !== s.id))}>✕</button>}
            </div>
            <div className="snippet-text narrative" dangerouslySetInnerHTML={{ __html: s.text }} />
            <p className="snippet-meta">{formatDate(s.ts)}</p>
          </div>
        ))}
    </div>
  );
}

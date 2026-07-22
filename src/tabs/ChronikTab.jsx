import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { REACTIONS, makeId, formatDate } from "../constants.js";

export default function ChronikTab({ gmMode, recaps, ur, reactions, react }) {
  const [expanded, setExpanded] = useState({});
  const [recapForm, setRecapForm] = useState({ date: "", title: "", text: "" });
  const [editingRecap, setEditingRecap] = useState(null);
  const [showRecapForm, setShowRecapForm] = useState(false);

  const addRecap = () => {
    if (!recapForm.title.trim() || !recapForm.text.trim()) return;
    if (editingRecap) {
      ur(recaps.map(r => r.id === editingRecap ? { ...r, date: recapForm.date || r.date, title: recapForm.title.trim(), text: recapForm.text } : r));
      setEditingRecap(null);
    } else {
      ur([{ id: makeId(), date: recapForm.date || new Date().toISOString().slice(0,10), title: recapForm.title.trim(), text: recapForm.text, ts: Date.now() }, ...recaps]);
    }
    setRecapForm({ date: "", title: "", text: "" }); setShowRecapForm(false);
  };

  const startEditRecap = (r) => {
    setRecapForm({ date: r.date || "", title: r.title, text: r.text });
    setEditingRecap(r.id); setShowRecapForm(true);
    setExpanded(e => ({ ...e, [r.id]: false }));
  };

  const recapDateLabel = (r) =>
    r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) : formatDate(r.ts);

  // Downloads all recaps as one standalone, print-friendly HTML chronicle,
  // oldest session first. Recap text is stored editor HTML and embedded as-is.
  const exportChronik = () => {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sortKey = (r) => r.date ? new Date(r.date + "T12:00:00").getTime() : (r.ts || 0);
    const sorted = [...recaps].sort((a, b) => sortKey(a) - sortKey(b));
    const articles = sorted.map(r => `
      <article>
        <p class="date">${esc(recapDateLabel(r))}</p>
        <h2>${esc(r.title)}</h2>
        <div class="text">${r.text || ""}</div>
      </article>`).join("\n");
    const exportedAt = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Witchlight M — Chronik</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: linear-gradient(160deg, #f3eaf8 0%, #e8d8f2 35%, #dde2f0 100%); color: #2a1838; font-family: 'IM Fell English', Georgia, serif; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 2.5rem 1.2rem 4rem; }
  header { text-align: center; margin-bottom: 2.5rem; }
  header h1 { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; font-size: 2rem; color: #7850a0; margin: 0; }
  header p { font-style: italic; color: #7a5890; margin: 0.3rem 0 0; }
  article { background: rgba(255,255,255,0.92); border: 1px solid #d8c4e8; border-radius: 12px; padding: 1.4rem 1.6rem; margin-bottom: 1.2rem; box-shadow: 0 6px 20px rgba(120,80,160,0.1); }
  article .date { font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #9a78b8; margin: 0 0 0.3rem; }
  article h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.3rem; color: #3a1858; margin: 0 0 0.8rem; }
  article .text { font-size: 1rem; line-height: 1.85; font-style: italic; white-space: pre-wrap; }
  .text ul { margin: 0.3rem 0 0.3rem 1.2rem; padding: 0; }
  .text li { margin-bottom: 0.2rem; }
  .text b, .text strong { color: #5a3878; }
  .text em, .text i { color: #7858a0; }
  .text hr { border: none; border-top: 1px solid #e0d0f0; margin: 0.5rem 0; }
  .text h1 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.6rem; color: #3a1858; margin: 0.8rem 0 0.4rem; padding-bottom: 0.25rem; border-bottom: 2px solid #d8b8e8; }
  .text h2 { font-family: 'Cinzel', serif; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; color: #5a3890; margin: 0.7rem 0 0.35rem; padding-bottom: 0.2rem; border-bottom: 1px solid #e8d8f4; }
  .text h3 { font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; color: #7850a0; margin: 0.6rem 0 0.3rem; }
  footer { text-align: center; font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.15em; text-transform: uppercase; color: #b0a0c0; margin-top: 2rem; }
  @media print {
    body { background: #fff; }
    article { break-inside: avoid; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Witchlight M</h1>
    <p>Kampagnen-Chronik ✦ ${sorted.length} Sitzung${sorted.length !== 1 ? "en" : ""}</p>
  </header>
${articles}
  <footer>Exportiert am ${esc(exportedAt)}</footer>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witchlight-chronik-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">📖 Chronik</p>
        <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
          {recaps.length > 0 && <button className="btn-add" onClick={exportChronik} title="Alle Sitzungszusammenfassungen als HTML-Datei herunterladen">⬇ Export</button>}
          {gmMode && <button className="btn-add" onClick={() => setShowRecapForm(v => !v)}>+ Neue Zusammenfassung</button>}
        </div>
      </div>
      {gmMode && showRecapForm && (
        <div className="form-panel">
          <p className="form-title">{editingRecap ? "Recap bearbeiten" : "Sitzungszusammenfassung"}</p>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Datum</label>
              <input className="f-input" type="date" value={recapForm.date} onChange={e => setRecapForm(f => ({...f, date: e.target.value}))} /></div>
            <div className="f-group"><label className="f-label">Titel</label>
              <input className="f-input" value={recapForm.title} onChange={e => setRecapForm(f => ({...f, title: e.target.value}))} placeholder="Der vergessene Wald" autoFocus /></div>
          </div>
          <div className="f-group"><label className="f-label">Was ist passiert?</label>
            <RichEditor value={recapForm.text} onChange={v => setRecapForm(f => ({...f, text: v}))} placeholder="Schreib hier deinen Recap..." rows={6} /></div>
          <div className="f-actions">
            <button className="btn-primary" onClick={addRecap} disabled={!recapForm.title.trim() || !recapForm.text.trim()}>{editingRecap ? "Änderungen speichern" : "Speichern"}</button>
            <button className="btn-secondary" onClick={() => { setShowRecapForm(false); setEditingRecap(null); setRecapForm({ date: "", title: "", text: "" }); }}>Abbrechen</button>
          </div>
        </div>
      )}
      {recaps.length === 0
        ? <div className="empty">Noch keine Sitzungen aufgezeichnet.<br /><span style={{fontSize:"0.85rem"}}>Der erste Eintrag wartet auf sein Abenteuer. ✨</span></div>
        : recaps.map(r => {
          const isOpen = expanded[r.id];
          const rReacts = reactions[r.id] || {};
          const hasReacts = Object.values(rReacts).some(v => v > 0);
          return (
            <div key={r.id} className="card">
              <div className="card-header" onClick={() => setExpanded(e => ({...e, [r.id]: !e[r.id]}))}>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.6rem",fontWeight:700,color:"#ddc8f0",lineHeight:1.4,paddingTop:"0.1rem",flexShrink:0}}>
                  {r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("de-DE", {day:"numeric",month:"short",year:"numeric"}) : formatDate(r.ts)}
                </span>
                <div className="card-info">
                  <p className="card-title">{r.title}</p>
                </div>
                {gmMode && <button className="btn-danger" onClick={e => { e.stopPropagation(); if(window.confirm("Löschen?")) ur(recaps.filter(x => x.id !== r.id)); }}>✕</button>}
                {gmMode && <button className="card-act-edit" onClick={e => { e.stopPropagation(); startEditRecap(r); }}>✎</button>}
                <span className={`card-chevron ${isOpen ? "open" : ""}`}>▼</span>
              </div>
              {isOpen && (
                <div className="card-body">
                  <div className="narrative" dangerouslySetInnerHTML={{ __html: r.text }} />
                  <div className="divider" />
                  {hasReacts && (
                    <div className="reactions-row">
                      {REACTIONS.map(emoji => rReacts[emoji] > 0 && (
                        <div key={emoji} className="react-btn"><span>{emoji}</span><span className="react-count">{rReacts[emoji]}</span></div>
                      ))}
                    </div>
                  )}
                  <div className="react-add-row">
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.42rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#8a68a8",alignSelf:"center"}}>Reagieren:</span>
                    {REACTIONS.map(emoji => <button key={emoji} className="add-react-btn" onClick={() => react(r.id, emoji)}>{emoji}</button>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

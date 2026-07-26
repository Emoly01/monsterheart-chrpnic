import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { REACTIONS, makeId, formatDate } from "../constants.js";
import flowerRed from "../assets/flower-red.png";

const HUES = ["#ffb400", "#12e0b6", "#ff2b1c"];
const plainPreview = (html, n = 210) => {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  const t = (d.textContent || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
};

export default function ChronikTab({ gmMode, playerName, needName, recaps, ur, reactions, react, pcs = [], quotes = [] }) {
  const [expanded, setExpanded] = useState({});
  const [recapForm, setRecapForm] = useState({ date: "", title: "", text: "" });
  const [editingRecap, setEditingRecap] = useState(null);
  const [showRecapForm, setShowRecapForm] = useState(false);

  // Anyone may write an entry; the GM and the entry's own author may edit or
  // delete it.
  const canEdit = (r) => gmMode || (!!r.author && r.author === playerName);

  const openNewForm = () => {
    if (!gmMode && !playerName) { needName(); return; }
    setEditingRecap(null);
    setRecapForm({ date: "", title: "", text: "" });
    setShowRecapForm(true);
  };

  const addRecap = () => {
    if (!recapForm.title.trim() || !recapForm.text.trim()) return;
    if (editingRecap) {
      ur(recaps.map(r => r.id === editingRecap ? { ...r, date: recapForm.date || r.date, title: recapForm.title.trim(), text: recapForm.text } : r));
      setEditingRecap(null);
    } else {
      ur([{ id: makeId(), date: recapForm.date || new Date().toISOString().slice(0,10), title: recapForm.title.trim(), text: recapForm.text, author: playerName?.trim() || (gmMode ? "SL" : "Gast"), ts: Date.now() }, ...recaps]);
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
<title>The Trinidad Diaries — Chronik</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: linear-gradient(160deg, #f2e7cf 0%, #ecdcbf 35%, #e6dcc2 100%); color: #241b12; font-family: 'IM Fell English', Georgia, serif; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 2.5rem 1.2rem 4rem; }
  header { text-align: center; margin-bottom: 2.5rem; }
  header h1 { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; font-size: 2rem; color: #a67c1e; margin: 0; }
  header p { font-style: italic; color: #8a6f4a; margin: 0.3rem 0 0; }
  article { background: rgba(255,255,255,0.92); border: 1px solid #ddcca6; border-radius: 12px; padding: 1.4rem 1.6rem; margin-bottom: 1.2rem; box-shadow: 0 6px 20px rgba(120,90,50,0.1); }
  article .date { font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #a8842e; margin: 0 0 0.3rem; }
  article h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.3rem; color: #2c2117; margin: 0 0 0.8rem; }
  article .text { font-size: 1rem; line-height: 1.85; font-style: italic; white-space: pre-wrap; }
  .text ul { margin: 0.3rem 0 0.3rem 1.2rem; padding: 0; }
  .text li { margin-bottom: 0.2rem; }
  .text b, .text strong { color: #7a5a1e; }
  .text em, .text i { color: #8a6a2a; }
  .text hr { border: none; border-top: 1px solid #e5d6b8; margin: 0.5rem 0; }
  .text h1 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.6rem; color: #2c2117; margin: 0.8rem 0 0.4rem; padding-bottom: 0.25rem; border-bottom: 2px solid #d8c090; }
  .text h2 { font-family: 'Cinzel', serif; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; color: #8a6a1a; margin: 0.7rem 0 0.35rem; padding-bottom: 0.2rem; border-bottom: 1px solid #ece0c6; }
  .text h3 { font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; color: #a67c1e; margin: 0.6rem 0 0.3rem; }
  footer { text-align: center; font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.15em; text-transform: uppercase; color: #b3a078; margin-top: 2rem; }
  @media print {
    body { background: #fff; }
    article { break-inside: avoid; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>The Trinidad Diaries</h1>
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
    a.download = `trinidad-diaries-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const latestQuote = quotes[0];

  return (
    <div className="page">
      {/* Hero */}
      <section className="diary-hero">
        <div className="diary-hero-glow" />
        <img className="diary-hero-flower" src={flowerRed} alt="" aria-hidden="true" />
        <h1 className="diary-hero-title">Chronik</h1>
        <p className="diary-hero-sub">Alles, was auf der Insel geschah — Sitzung für Sitzung, festgehalten bevor die Erinnerung im Nebel verschwindet.</p>
      </section>

      <div className="diary-grid">
        <main>
          <div className="diary-main-hdr">
            <span className="eyebrow">Sitzungen — Neueste zuerst</span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {recaps.length > 0 && <button className="btn-add" onClick={exportChronik} title="Alle Einträge als HTML-Datei herunterladen">⬇ Export</button>}
              <button className="btn-primary" onClick={openNewForm}>+ Neuer Eintrag</button>
            </div>
          </div>

          {showRecapForm && (
            <div className="form-panel">
              <p className="form-title">{editingRecap ? "Eintrag bearbeiten" : "Neuer Eintrag"}</p>
              <div className="f-row">
                <div className="f-group"><label className="f-label">Datum</label>
                  <input className="f-input" type="date" value={recapForm.date} onChange={e => setRecapForm(f => ({...f, date: e.target.value}))} /></div>
                <div className="f-group"><label className="f-label">Titel</label>
                  <input className="f-input" value={recapForm.title} onChange={e => setRecapForm(f => ({...f, title: e.target.value}))} placeholder="z.B. Die Nacht nach der Fête" autoFocus /></div>
              </div>
              <div className="f-group"><label className="f-label">Was ist passiert?</label>
                <RichEditor value={recapForm.text} onChange={v => setRecapForm(f => ({...f, text: v}))} placeholder="Schreib hier deinen Recap..." rows={6} /></div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addRecap} disabled={!recapForm.title.trim() || !recapForm.text.trim()}>{editingRecap ? "Änderungen speichern" : "Speichern"}</button>
                <button className="btn-secondary" onClick={() => { setShowRecapForm(false); setEditingRecap(null); setRecapForm({ date: "", title: "", text: "" }); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {recaps.length === 0 ? (
            <div className="empty">
              <img className="empty-flower" src={flowerRed} alt="" aria-hidden="true" />
              <p className="empty-title">Noch keine Sitzungen aufgezeichnet.</p>
              <p className="empty-sub">Der erste Eintrag wartet auf sein Abenteuer.</p>
            </div>
          ) : (
            <div className="session-list">
              {recaps.map((r, i) => {
                const num = String(recaps.length - i).padStart(2, "0");
                const hue = HUES[i % HUES.length];
                const isOpen = expanded[r.id];
                const rReacts = reactions[r.id] || {};
                const hasReacts = Object.values(rReacts).some(v => v > 0);
                const dateLabel = r.date
                  ? new Date(r.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })
                  : formatDate(r.ts);
                return (
                  <article key={r.id} className="session-card" style={{ borderLeftColor: hue }}>
                    <div className="session-num-col">
                      <div className="eyebrow">Sitzung</div>
                      <div className="session-num" style={{ color: hue }}>{num}</div>
                      <div className="session-date">{dateLabel}</div>
                    </div>
                    <div className="session-body">
                      <div className="session-meta">
                        <span className="session-dot" style={{ background: hue }} />
                        <span className="session-who">{r.author ? `✍ ${r.author}` : "Chronik"}</span>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {canEdit(r) && <button className="card-act-edit" title="Bearbeiten" onClick={() => startEditRecap(r)}>✎</button>}
                          {canEdit(r) && <button className="btn-danger" title="Löschen" onClick={() => { if (window.confirm("Löschen?")) ur(recaps.filter(x => x.id !== r.id)); }}>🗑</button>}
                          <button className="btn-danger" title={isOpen ? "Einklappen" : "Ausklappen"} onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))}>
                            <span className={`card-chevron ${isOpen ? "open" : ""}`}>▼</span>
                          </button>
                        </div>
                      </div>
                      <h3 className="session-title" onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))}>{r.title}</h3>
                      {!isOpen
                        ? <p className="session-preview" onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))}>{plainPreview(r.text)}</p>
                        : (
                          <>
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
                              <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9aa89c", alignSelf: "center" }}>Reagieren:</span>
                              {REACTIONS.map(emoji => <button key={emoji} className="add-react-btn" onClick={() => react(r.id, emoji)}>{emoji}</button>)}
                            </div>
                          </>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Right rail — the party + latest quote */}
        <aside className="diary-rail">
          <div className="rail-card">
            <div className="rail-title" style={{ color: "#12e0b6" }}>Die Runde</div>
            {pcs.length === 0
              ? <p className="rail-empty">Noch keine Charaktere angelegt.</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                  {pcs.map((c, i) => (
                    <div key={c.id} className="rail-member">
                      <span className="rail-initial" style={{ color: HUES[i % HUES.length] }}>
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="rail-member-name">{c.name}</div>
                        {c.concept && <div className="rail-member-role">{c.concept}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div className="rail-card rail-quote-card">
            <div className="rail-title" style={{ color: "#ffb400" }}>Zitat der Woche</div>
            {latestQuote
              ? <>
                  <p className="rail-quote-text">„{latestQuote.text}"</p>
                  <div className="rail-quote-who">— {latestQuote.speaker}{latestQuote.sitzung ? ` · ${latestQuote.sitzung}` : ""}</div>
                </>
              : <p className="rail-empty">Noch keine Zitate gesammelt.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

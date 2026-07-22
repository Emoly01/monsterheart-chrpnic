import { useState } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId } from "../constants.js";

export default function TarotTab({ gmMode, tarotReadings, utr, tarotSpreads, uts }) {
  const [tarotForm, setTarotForm] = useState({ date: "", title: "", spread: "", cards: [{ position: "", name: "", reversed: false }], publicText: "", gmText: "" });
  const [showTarotForm, setShowTarotForm] = useState(false);
  const [editingTarot, setEditingTarot] = useState(null);
  const [expandedTarot, setExpandedTarot] = useState(null);
  const [tarotTab, setTarotTab] = useState("lesungen");
  const [spreadForm, setSpreadForm] = useState({ name: "", description: "", positions: [{ name: "", meaning: "" }] });
  const [showSpreadForm, setShowSpreadForm] = useState(false);
  const [editingSpread, setEditingSpread] = useState(null);
  const [expandedSpread, setExpandedSpread] = useState(null);

  const addTarot = () => {
    if (!tarotForm.title.trim()) return;
    const reading = {
      id: editingTarot || makeId(),
      date: tarotForm.date || new Date().toISOString().slice(0,10),
      title: tarotForm.title.trim(),
      spread: tarotForm.spread.trim(),
      cards: tarotForm.cards.filter(c => c.name.trim()),
      publicText: tarotForm.publicText,
      gmText: tarotForm.gmText,
      ts: editingTarot ? (tarotReadings.find(r => r.id === editingTarot)?.ts ?? Date.now()) : Date.now(),
    };
    if (editingTarot) {
      utr(tarotReadings.map(r => r.id === editingTarot ? reading : r));
      setEditingTarot(null);
    } else {
      utr([reading, ...tarotReadings]);
    }
    setTarotForm({ date: "", title: "", spread: "", cards: [{ position: "", name: "", reversed: false }], publicText: "", gmText: "" });
    setShowTarotForm(false);
  };
  const startEditTarot = (r) => {
    setTarotForm({ date: r.date || "", title: r.title, spread: r.spread || "", cards: r.cards?.length ? r.cards : [{ position: "", name: "", reversed: false }], publicText: r.publicText || "", gmText: r.gmText || "" });
    setEditingTarot(r.id);
    setShowTarotForm(true);
    setExpandedTarot(null);
  };
  const addSpread = () => {
    if (!spreadForm.name.trim()) return;
    const spread = {
      id: editingSpread || makeId(),
      name: spreadForm.name.trim(),
      description: spreadForm.description.trim(),
      positions: spreadForm.positions.filter(p => p.name.trim()),
      isPublic: editingSpread ? (tarotSpreads.find(s => s.id === editingSpread)?.isPublic ?? false) : false,
      ts: editingSpread ? (tarotSpreads.find(s => s.id === editingSpread)?.ts ?? Date.now()) : Date.now(),
    };
    if (editingSpread) {
      uts(tarotSpreads.map(s => s.id === editingSpread ? spread : s));
      setEditingSpread(null);
    } else {
      uts([spread, ...tarotSpreads]);
    }
    setSpreadForm({ name: "", description: "", positions: [{ name: "", meaning: "" }] });
    setShowSpreadForm(false);
  };
  const startEditSpread = (s) => {
    setSpreadForm({ name: s.name, description: s.description || "", positions: s.positions?.length ? s.positions : [{ name: "", meaning: "" }] });
    setEditingSpread(s.id);
    setShowSpreadForm(true);
    setExpandedSpread(null);
  };
  const toggleSpreadPublic = (id) => {
    uts(tarotSpreads.map(s => s.id === id ? { ...s, isPublic: !s.isPublic } : s));
  };

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🔮 Tarot-Lesungen</p>
        {gmMode && tarotTab === "lesungen" && (
          <button className="btn-add" onClick={() => { setShowTarotForm(v => !v); setEditingTarot(null); setTarotForm({ date: "", title: "", spread: "", cards: [{ position: "", name: "", reversed: false }], publicText: "", gmText: "" }); }}>+ Lesung</button>
        )}
        {gmMode && tarotTab === "legungen" && (
          <button className="btn-add" onClick={() => { setShowSpreadForm(v => !v); setEditingSpread(null); setSpreadForm({ name: "", description: "", positions: [{ name: "", meaning: "" }] }); }}>+ Legung</button>
        )}
      </div>

      {gmMode && (
        <div className="gm-sub-tabs">
          <button className={`gm-sub-tab ${tarotTab === "lesungen" ? "active" : ""}`} onClick={() => setTarotTab("lesungen")}>
            <span>🔮</span> Lesungen {tarotReadings.length > 0 && <span className="gm-sub-count">({tarotReadings.length})</span>}
          </button>
          <button className={`gm-sub-tab ${tarotTab === "legungen" ? "active" : ""}`} onClick={() => setTarotTab("legungen")}>
            <span>🃏</span> Legungen {tarotSpreads.length > 0 && <span className="gm-sub-count">({tarotSpreads.length})</span>}
          </button>
        </div>
      )}

      {/* ── Lesungen ── */}
      {(!gmMode || tarotTab === "lesungen") && (
        <>
          {gmMode && showTarotForm && (
            <div className="form-panel">
              <p className="form-title">{editingTarot ? "Lesung bearbeiten" : "Neue Tarot-Lesung"}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 0.6rem" }}>
                <div className="f-group">
                  <label className="f-label">Datum</label>
                  <input className="f-input" type="date" value={tarotForm.date} onChange={e => setTarotForm(f => ({...f, date: e.target.value}))} />
                </div>
                <div className="f-group">
                  <label className="f-label">Legungsart</label>
                  <input className="f-input" value={tarotForm.spread} onChange={e => setTarotForm(f => ({...f, spread: e.target.value}))} placeholder="z.B. Keltenkreuz..." />
                </div>
              </div>
              <div className="f-group">
                <label className="f-label">Titel</label>
                <input className="f-input" value={tarotForm.title} onChange={e => setTarotForm(f => ({...f, title: e.target.value}))} placeholder="z.B. Die drei Schicksale..." autoFocus />
              </div>
              <div className="f-group">
                <label className="f-label">Karten</label>
                {tarotForm.cards.map((card, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <input className="f-input" style={{ flex: "0 0 32%" }} value={card.position} onChange={e => setTarotForm(f => { const cards = [...f.cards]; cards[i] = { ...cards[i], position: e.target.value }; return { ...f, cards }; })} placeholder="Position..." />
                    <input className="f-input" style={{ flex: 1 }} value={card.name} onChange={e => setTarotForm(f => { const cards = [...f.cards]; cards[i] = { ...cards[i], name: e.target.value }; return { ...f, cards }; })} placeholder="Karte..." />
                    <label style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontFamily: "'Cinzel', serif", fontSize: "0.5rem", color: "#7a5890", flexShrink: 0, cursor: "pointer" }} title="Umgekehrt">
                      <input type="checkbox" checked={card.reversed} onChange={e => setTarotForm(f => { const cards = [...f.cards]; cards[i] = { ...cards[i], reversed: e.target.checked }; return { ...f, cards }; })} />
                      ↩
                    </label>
                    {tarotForm.cards.length > 1 && (
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#c090a0", fontSize: "0.8rem", flexShrink: 0 }} onClick={() => setTarotForm(f => ({ ...f, cards: f.cards.filter((_, j) => j !== i) }))}>✕</button>
                    )}
                  </div>
                ))}
                <button className="btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem", marginTop: "0.2rem" }} onClick={() => setTarotForm(f => ({ ...f, cards: [...f.cards, { position: "", name: "", reversed: false }] }))}>+ Karte</button>
              </div>
              <div className="f-group">
                <label className="f-label">Öffentliche Deutung</label>
                <RichEditor value={tarotForm.publicText} onChange={v => setTarotForm(f => ({...f, publicText: v}))} placeholder="Was die Spieler über die Lesung wissen..." rows={4} />
              </div>
              <div className="f-group">
                <label className="f-label" style={{ color: "#c094c8" }}>🔐 GM-Notizen</label>
                <RichEditor value={tarotForm.gmText} onChange={v => setTarotForm(f => ({...f, gmText: v}))} placeholder="Verborgene Bedeutungen, Plot-Hinweise, wahre Deutung..." rows={4} />
              </div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addTarot} disabled={!tarotForm.title.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowTarotForm(false); setEditingTarot(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {tarotReadings.length === 0
            ? <div className="empty">Noch keine Tarot-Lesungen.<br /><span style={{fontSize:"0.85rem"}}>Die Karten schweigen noch. 🔮</span></div>
            : tarotReadings.map(reading => {
              const isOpen = expandedTarot === reading.id;
              const dateStr = reading.date ? new Date(reading.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) : null;
              const filledCards = reading.cards?.filter(c => c.name) ?? [];
              return (
                <div key={reading.id} className="tarot-reading-card">
                  <div className="tarot-card-hdr" onClick={() => setExpandedTarot(isOpen ? null : reading.id)}>
                    <div className="tarot-card-hdr-left">
                      <p className="tarot-card-title">{reading.title}</p>
                      <p className="tarot-card-meta">
                        {dateStr}{reading.spread ? ` · ${reading.spread}` : ""}
                        {filledCards.length > 0 ? ` · ${filledCards.length} Karte${filledCards.length !== 1 ? "n" : ""}` : ""}
                      </p>
                    </div>
                    <span className={`tarot-chevron ${isOpen ? "open" : ""}`}>▾</span>
                  </div>
                  {isOpen && (
                    <div className="tarot-card-body">
                      {filledCards.length > 0 && (
                        <div style={{ marginBottom: "0.9rem" }}>
                          <p className="tarot-chips-label">Gezogene Karten</p>
                          <div className="tarot-chips-row">
                            {filledCards.map((card, i) => (
                              <div key={i} className="tarot-chip">
                                {card.position && <p className="tarot-chip-pos">{card.position}</p>}
                                <p className={`tarot-chip-name${card.reversed ? " reversed" : ""}`}>{card.name}{card.reversed ? " ↩" : ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {reading.publicText && (
                        <div className="narrative" dangerouslySetInnerHTML={{ __html: reading.publicText }} />
                      )}
                      {gmMode && reading.gmText && (
                        <div className="tarot-gm-box">
                          <p className="tarot-gm-label">🔐 GM-Notizen</p>
                          <div className="narrative" dangerouslySetInnerHTML={{ __html: reading.gmText }} />
                        </div>
                      )}
                      {gmMode && (
                        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px dashed #ede0f8" }}>
                          <button className="btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem" }} onClick={() => startEditTarot(reading)}>✏ Bearbeiten</button>
                          <button className="btn-danger" onClick={() => { utr(tarotReadings.filter(r => r.id !== reading.id)); setExpandedTarot(null); }}>✕ Löschen</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          }

          {tarotSpreads.filter(s => s.isPublic).length > 0 && (
            <div className="pub-spreads-section">
              <p className="pub-spreads-title">✦ Bekannte Legungen</p>
              {tarotSpreads.filter(s => s.isPublic).map(spread => {
                const isOpen = expandedSpread === spread.id;
                return (
                  <div key={spread.id} className="spread-card">
                    <div className="spread-card-hdr" onClick={() => setExpandedSpread(isOpen ? null : spread.id)}>
                      <div className="spread-card-info">
                        <p className="spread-card-name">{spread.name}</p>
                        {spread.positions?.filter(p=>p.name).length > 0 && <p className="spread-card-meta">{spread.positions.filter(p=>p.name).length} Positionen{spread.description ? ` · ${spread.description}` : ""}</p>}
                      </div>
                      <span className={`card-chevron ${isOpen ? "open" : ""}`}>▾</span>
                    </div>
                    {isOpen && (
                      <div className="spread-card-body">
                        {spread.description && <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "0.88rem", color: "#5a4070", marginBottom: "0.8rem", lineHeight: "1.65" }}>{spread.description}</p>}
                        {spread.positions?.filter(p => p.name).length > 0 && (
                          <div className="spread-positions-grid">
                            {spread.positions.filter(p => p.name).map((pos, i) => (
                              <div key={i} className="spread-pos-item">
                                <p className="spread-pos-num">Position {i + 1}</p>
                                <p className="spread-pos-name">{pos.name}</p>
                                {pos.meaning && <p className="spread-pos-meaning">{pos.meaning}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Legungen (GM only) ── */}
      {gmMode && tarotTab === "legungen" && (
        <>
          {showSpreadForm && (
            <div className="form-panel">
              <p className="form-title">{editingSpread ? "Legung bearbeiten" : "Neue Legung"}</p>
              <div className="f-group">
                <label className="f-label">Name</label>
                <input className="f-input" value={spreadForm.name} onChange={e => setSpreadForm(f => ({...f, name: e.target.value}))} placeholder="z.B. Keltenkreuz, Drei-Karten-Legung..." autoFocus />
              </div>
              <div className="f-group">
                <label className="f-label">Beschreibung</label>
                <input className="f-input" value={spreadForm.description} onChange={e => setSpreadForm(f => ({...f, description: e.target.value}))} placeholder="Kurze Beschreibung der Legung..." />
              </div>
              <div className="f-group">
                <label className="f-label">Positionen</label>
                {spreadForm.positions.map((pos, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.48rem", color: "#c094c8", flexShrink: 0, paddingTop: "0.55rem", minWidth: "1.1rem", textAlign: "center" }}>{i + 1}</span>
                    <input className="f-input" style={{ flex: "0 0 36%" }} value={pos.name} onChange={e => setSpreadForm(f => { const positions = [...f.positions]; positions[i] = { ...positions[i], name: e.target.value }; return { ...f, positions }; })} placeholder="Name..." />
                    <input className="f-input" style={{ flex: 1 }} value={pos.meaning} onChange={e => setSpreadForm(f => { const positions = [...f.positions]; positions[i] = { ...positions[i], meaning: e.target.value }; return { ...f, positions }; })} placeholder="Bedeutung..." />
                    {spreadForm.positions.length > 1 && (
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#c090a0", fontSize: "0.8rem", flexShrink: 0, paddingTop: "0.4rem" }} onClick={() => setSpreadForm(f => ({ ...f, positions: f.positions.filter((_, j) => j !== i) }))}>✕</button>
                    )}
                  </div>
                ))}
                <button className="btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem", marginTop: "0.2rem" }} onClick={() => setSpreadForm(f => ({ ...f, positions: [...f.positions, { name: "", meaning: "" }] }))}>+ Position</button>
              </div>
              <div className="f-actions">
                <button className="btn-primary" onClick={addSpread} disabled={!spreadForm.name.trim()}>Speichern</button>
                <button className="btn-secondary" onClick={() => { setShowSpreadForm(false); setEditingSpread(null); }}>Abbrechen</button>
              </div>
            </div>
          )}

          {tarotSpreads.length === 0
            ? <div className="empty">Noch keine Legungen geplant.<br /><span style={{fontSize:"0.85rem"}}>Lege Spread-Vorlagen an und veröffentliche sie wenn die Zeit kommt. 🃏</span></div>
            : tarotSpreads.map(spread => {
              const isOpen = expandedSpread === spread.id;
              return (
                <div key={spread.id} className="spread-card">
                  <div className="spread-card-hdr" onClick={() => setExpandedSpread(isOpen ? null : spread.id)}>
                    <div className="spread-card-info">
                      <p className="spread-card-name">{spread.name}</p>
                      <p className="spread-card-meta">
                        {spread.positions?.filter(p=>p.name).length ?? 0} Positionen{spread.description ? ` · ${spread.description}` : ""}
                      </p>
                    </div>
                    <span className={`spread-pub-badge ${spread.isPublic ? "public" : "private"}`}>{spread.isPublic ? "✦ Öffentlich" : "◌ Entwurf"}</span>
                    <span className={`card-chevron ${isOpen ? "open" : ""}`}>▾</span>
                  </div>
                  {isOpen && (
                    <div className="spread-card-body">
                      {spread.positions?.filter(p => p.name).length > 0 && (
                        <div className="spread-positions-grid">
                          {spread.positions.filter(p => p.name).map((pos, i) => (
                            <div key={i} className="spread-pos-item">
                              <p className="spread-pos-num">Position {i + 1}</p>
                              <p className="spread-pos-name">{pos.name}</p>
                              {pos.meaning && <p className="spread-pos-meaning">{pos.meaning}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
                        <button className={spread.isPublic ? "btn-secondary" : "btn-primary"} style={{ fontSize: "0.7rem", padding: "0.3rem 0.8rem" }} onClick={() => toggleSpreadPublic(spread.id)}>
                          {spread.isPublic ? "◌ Als Entwurf" : "✦ Veröffentlichen"}
                        </button>
                        <button className="btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem" }} onClick={() => startEditSpread(spread)}>✏ Bearbeiten</button>
                        <button className="btn-danger" onClick={() => { uts(tarotSpreads.filter(s => s.id !== spread.id)); setExpandedSpread(null); }}>✕ Löschen</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}
    </div>
  );
}

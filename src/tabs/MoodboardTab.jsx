import { useState, useEffect } from "react";
import { makeId, formatDate } from "../constants.js";

// Campaign-wide moodboard: a shared wall of inspiration images posted by link
// (imgur etc.). Same collaborative model as the room moodboards — anyone with a
// name posts, removes their own; the GM removes any.
export default function MoodboardTab({ gmMode, playerName, needName, moodboard, umb }) {
  const [form, setForm] = useState({ url: "", caption: "" });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const addImage = () => {
    const url = form.url.trim();
    if (!url || (!playerName && !gmMode)) return;
    umb([{ id: makeId(), url, caption: form.caption.trim(), addedBy: playerName || "GM", ts: Date.now() }, ...moodboard]);
    setForm({ url: "", caption: "" });
  };
  const removeImage = (id) => umb(moodboard.filter(m => m.id !== id));

  return (
    <div className="page">
      <div className="section-hdr"><p className="section-title">🖼 Moodboard</p></div>
      <p style={{fontFamily:"'Spectral', serif",fontStyle:"italic",color:"#9aa89c",margin:"0 0 1rem",fontSize:"0.95rem"}}>
        Eine gemeinsame Wand der Inspiration — poste Bilder per Link (z.B. von imgur).
      </p>

      {(playerName || gmMode) ? (
        <div className="form-panel">
          <p className="form-title">Bild posten</p>
          <div className="f-group"><label className="f-label">Bild-URL</label>
            <input className="f-input" value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
              placeholder="https://i.imgur.com/..." /></div>
          <div className="f-group"><label className="f-label">Bildunterschrift (optional)</label>
            <input className="f-input" value={form.caption} onChange={e => setForm(f => ({...f, caption: e.target.value}))}
              onKeyDown={e => e.key === "Enter" && addImage()} placeholder="Was inspiriert dich hier?" /></div>
          <button className="btn-primary" onClick={addImage} disabled={!form.url.trim()}>Posten</button>
        </div>
      ) : (
        <div className="empty" style={{paddingTop:"1rem"}}>
          Gib zuerst deinen Charakternamen ein, um Bilder zu posten.<br />
          <button className="btn-add" style={{marginTop:"0.8rem"}} onClick={needName}>Namen eingeben</button>
        </div>
      )}

      {moodboard.length === 0
        ? <div className="empty">Noch keine Bilder an der Wand.<br /><span style={{fontSize:"0.85rem"}}>Das erste Stück Inspiration wartet. 🖼</span></div>
        : <div className="gallery-grid">
          {moodboard.map(img => (
            <div key={img.id} className="mb-thumb" onClick={() => setLightbox(img)} title={img.caption || ""}>
              <img src={img.url} alt={img.caption || "Moodboard-Bild"} onError={e => { e.target.style.display = "none"; }} />
              {img.caption && <span className="mb-cap">{img.caption}</span>}
              {(gmMode || img.addedBy === playerName) && (
                <button className="mb-del" title="Entfernen" onClick={e => { e.stopPropagation(); removeImage(img.id); }}>✕</button>
              )}
            </div>
          ))}
        </div>
      }

      {lightbox && (
        <div className="overlay" onClick={() => setLightbox(null)} style={{flexDirection:"column",cursor:"zoom-out"}}>
          <img className="mb-lightbox-img" src={lightbox.url} alt={lightbox.caption || "Moodboard-Bild"} onClick={e => e.stopPropagation()} />
          <p className="mb-lightbox-cap">
            {lightbox.caption ? lightbox.caption + " " : ""}
            <span style={{opacity:0.7,fontSize:"0.8rem"}}>— {lightbox.addedBy} · {formatDate(lightbox.ts)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

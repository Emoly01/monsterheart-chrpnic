import { useState, useRef, useEffect } from "react";
import RichEditor from "../RichEditor.jsx";
import { makeId, formatDate } from "../constants.js";

// Fixed cottage footprint. Each room's rectangle (in the SVG viewBox 0 0 440 340)
// is drawn as a clickable region; the room's live data is matched by id. Extra
// rooms the GM adds don't fit the fixed plan, so they show as "Anbauten" chips.
const ROOM_LAYOUT = {
  "schlafzimmer-1": { x: 20,  y: 20,  w: 140, h: 100 },
  "schlafzimmer-2": { x: 20,  y: 120, w: 140, h: 100 },
  "bibliothek":     { x: 20,  y: 220, w: 140, h: 100 },
  "wohnzimmer":     { x: 160, y: 20,  w: 140, h: 200 },
  "esszimmer":      { x: 160, y: 220, w: 140, h: 100 },
  "schlafzimmer-3": { x: 300, y: 20,  w: 120, h: 100 },
  "schlafzimmer-4": { x: 300, y: 120, w: 120, h: 100 },
  "schlafzimmer-5": { x: 300, y: 220, w: 120, h: 100 },
};
const DEFAULT_ROOMS = [
  { id: "wohnzimmer",     name: "Wohnzimmer",     icon: "🛋" },
  { id: "esszimmer",      name: "Esszimmer",      icon: "🍽" },
  { id: "bibliothek",     name: "Bibliothek",     icon: "📚", library: true },
  { id: "schlafzimmer-1", name: "Schlafzimmer 1", icon: "🛏", bedroom: true },
  { id: "schlafzimmer-2", name: "Schlafzimmer 2", icon: "🛏", bedroom: true },
  { id: "schlafzimmer-3", name: "Schlafzimmer 3", icon: "🛏", bedroom: true },
  { id: "schlafzimmer-4", name: "Schlafzimmer 4", icon: "🛏", bedroom: true },
  { id: "schlafzimmer-5", name: "Schlafzimmer 5", icon: "🛏", bedroom: true },
];
const HAUS_INFO_ID = "haus-info";
const DEFAULT_HAUS_INFO = "Eine steinerne Hütte in einem extradimensionalen Raum — von außen bescheiden, innen überraschend geräumig: fünf Schlafzimmer, ein Wohnzimmer, ein Esszimmer und eine Bibliothek.";

export default function HausTab({ gmMode, playerName, needName, haus, uh }) {
  const [selected, setSelected] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [itemInputs, setItemInputs] = useState({});
  const [imgInputs, setImgInputs] = useState({});
  const [bookInputs, setBookInputs] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState("");
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: "", icon: "", bedroom: false, library: false });
  const detailRef = useRef(null);

  const infoDoc = haus.find(r => r.id === HAUS_INFO_ID);
  const stored = (id) => haus.find(r => r.id === id);
  const fixedRooms = DEFAULT_ROOMS.map(def => ({ ...def, ...(stored(def.id) || {}) }));
  const customRooms = haus
    .filter(r => r.id !== HAUS_INFO_ID && !DEFAULT_ROOMS.some(d => d.id === r.id))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const allRooms = [...fixedRooms, ...customRooms];
  const selectedRoom = allRooms.find(r => r.id === selected) || null;

  useEffect(() => {
    if (selected && detailRef.current) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }, [selected]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const writeRoom = (room, changes) => {
    if (haus.some(r => r.id === room.id)) uh(haus.map(r => r.id === room.id ? { ...r, ...changes } : r));
    else uh([...haus, { ...room, ...changes }]);
  };

  const canEditRoom = (room) => gmMode || (room.bedroom && room.owner && room.owner === playerName);

  const startEditRoom = (room) => {
    setEditForm({ name: room.name, description: room.description || "" });
    setEditingRoom(room.id);
  };
  const saveEditRoom = (room) => {
    writeRoom(room, { name: editForm.name.trim() || room.name, description: editForm.description });
    setEditingRoom(null);
  };

  const addItem = (room) => {
    const text = (itemInputs[room.id] || "").trim();
    if (!text || (!playerName && !gmMode)) return;
    writeRoom(room, { items: [...(room.items || []), { id: makeId(), name: text, addedBy: playerName || "GM", ts: Date.now() }] });
    setItemInputs(s => ({ ...s, [room.id]: "" }));
  };
  const removeItem = (room, itemId) => {
    writeRoom(room, { items: (room.items || []).filter(i => i.id !== itemId) });
  };

  const addImage = (room) => {
    const inp = imgInputs[room.id] || {};
    const url = (inp.url || "").trim();
    if (!url || (!playerName && !gmMode)) return;
    writeRoom(room, { gallery: [...(room.gallery || []), { id: makeId(), url, caption: (inp.caption || "").trim(), addedBy: playerName || "GM", ts: Date.now() }] });
    setImgInputs(s => ({ ...s, [room.id]: { url: "", caption: "" } }));
  };
  const removeImage = (room, imgId) => {
    writeRoom(room, { gallery: (room.gallery || []).filter(i => i.id !== imgId) });
  };

  const addBook = (room) => {
    const inp = bookInputs[room.id] || {};
    const title = (inp.title || "").trim();
    if (!title || (!playerName && !gmMode)) return;
    writeRoom(room, { books: [...(room.books || []), { id: makeId(), title, author: (inp.author || "").trim(), notes: (inp.notes || "").trim(), read: false, addedBy: playerName || "GM", ts: Date.now() }] });
    setBookInputs(s => ({ ...s, [room.id]: { title: "", author: "", notes: "" } }));
  };
  const removeBook = (room, bookId) => {
    writeRoom(room, { books: (room.books || []).filter(b => b.id !== bookId) });
  };
  const toggleBookRead = (room, bookId) => {
    writeRoom(room, { books: (room.books || []).map(b => b.id === bookId ? { ...b, read: !b.read } : b) });
  };

  const saveInfo = () => {
    if (infoDoc) uh(haus.map(r => r.id === HAUS_INFO_ID ? { ...r, description: infoDraft } : r));
    else uh([...haus, { id: HAUS_INFO_ID, description: infoDraft }]);
    setEditingInfo(false);
  };

  const addRoom = () => {
    if (!roomForm.name.trim()) return;
    uh([...haus, { id: makeId(), name: roomForm.name.trim(), icon: roomForm.icon.trim() || "🚪", bedroom: roomForm.bedroom, library: roomForm.library, custom: true, ts: Date.now() }]);
    setRoomForm({ name: "", icon: "", bedroom: false, library: false });
    setShowRoomForm(false);
  };
  const deleteRoom = (room) => {
    if (window.confirm(`${room.name} wirklich abreißen?`)) {
      uh(haus.filter(r => r.id !== room.id));
      if (selected === room.id) setSelected(null);
    }
  };

  const roomFill = (room) => {
    if (room.bedroom) return room.owner ? "#e6d4f6" : "#faf5ff";
    return "#fdf6f0";
  };
  const shortLabel = (room) => room.bedroom ? room.name.replace("Schlafzimmer", "Zimmer") : room.name;
  const planStatus = (room) => {
    if (room.bedroom) {
      if (!room.owner) return "frei";
      return room.owner.length > 12 ? room.owner.slice(0, 11) + "…" : room.owner;
    }
    const c = (room.items || []).length;
    return c > 0 ? `${c} ◦` : "";
  };
  const displayName = (room) => room.bedroom && room.owner ? `${room.owner}s Zimmer` : room.name;

  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🏡 Das Haus</p>
        {gmMode && <button className="btn-add" onClick={() => setShowRoomForm(v => !v)}>+ Raum</button>}
      </div>

      {/* House intro */}
      <div className="card" style={{marginBottom:"1rem"}}>
        {editingInfo ? (
          <>
            <RichEditor value={infoDraft} onChange={setInfoDraft} placeholder="Beschreibung des Hauses..." rows={3} />
            <div className="f-actions">
              <button className="btn-primary" onClick={saveInfo}>Speichern</button>
              <button className="btn-secondary" onClick={() => setEditingInfo(false)}>Abbrechen</button>
            </div>
          </>
        ) : (
          <div style={{display:"flex",gap:"0.6rem",alignItems:"flex-start"}}>
            <div className="narrative" style={{flex:1}} dangerouslySetInnerHTML={{ __html: infoDoc?.description || DEFAULT_HAUS_INFO }} />
            {gmMode && <button className="card-act-edit" onClick={() => { setInfoDraft(infoDoc?.description || DEFAULT_HAUS_INFO); setEditingInfo(true); }}>✎</button>}
          </div>
        )}
      </div>

      {/* GM: add a room */}
      {gmMode && showRoomForm && (
        <div className="form-panel">
          <p className="form-title">Neuer Raum</p>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Symbol</label>
              <input className="f-input" value={roomForm.icon} onChange={e => setRoomForm(f=>({...f,icon:e.target.value}))} placeholder="🚪" /></div>
            <div className="f-group"><label className="f-label">Name</label>
              <input className="f-input" value={roomForm.name} onChange={e => setRoomForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Alchemielabor" autoFocus /></div>
          </div>
          <label className="pakt-vis-check">
            <input type="checkbox" checked={roomForm.bedroom} onChange={e => setRoomForm(f=>({...f,bedroom:e.target.checked}))} />
            <span>🛏 Schlafzimmer (beanspruchbar)</span>
          </label>
          <label className="pakt-vis-check">
            <input type="checkbox" checked={roomForm.library} onChange={e => setRoomForm(f=>({...f,library:e.target.checked}))} />
            <span>📚 Bibliothek (Büchersammlung)</span>
          </label>
          <div className="f-actions">
            <button className="btn-primary" onClick={addRoom} disabled={!roomForm.name.trim()}>Anbauen</button>
            <button className="btn-secondary" onClick={() => setShowRoomForm(false)}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Clickable floor plan */}
      <div className="floorplan-wrap">
        <svg className="floorplan" viewBox="0 0 440 340" role="img" aria-label="Grundriss der Steinhütte">
          {/* floor + outer stone wall */}
          <rect x="20" y="20" width="400" height="300" rx="7" fill="#f6eefa" />
          {fixedRooms.map(room => {
            const p = ROOM_LAYOUT[room.id];
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            const status = planStatus(room);
            return (
              <g key={room.id} className={`fp-room ${selected === room.id ? "selected" : ""}`}
                onClick={() => setSelected(selected === room.id ? null : room.id)}>
                <rect className="fp-rect" x={p.x} y={p.y} width={p.w} height={p.h} rx="3"
                  fill={roomFill(room)} stroke="#c8a8e8" strokeWidth="1.5" />
                <text className="fp-icon" x={cx} y={cy - 12} textAnchor="middle">{room.icon}</text>
                <text className="fp-name" x={cx} y={cy + 10} textAnchor="middle" fontSize="12">{shortLabel(room)}</text>
                {status && <text className="fp-status" x={cx} y={cy + 24} textAnchor="middle" fontSize="8.5">{status}</text>}
              </g>
            );
          })}
          {/* outer wall on top of room borders */}
          <rect x="20" y="20" width="400" height="300" rx="7" fill="none" stroke="#a888c8" strokeWidth="4" />
          {/* front door */}
          <rect x="214" y="314" width="32" height="11" rx="2" fill="#c8a878" stroke="#a888c8" strokeWidth="1.5" />
        </svg>
        <div className="fp-legend">
          <span><i style={{background:"#faf5ff"}} />Freies Zimmer</span>
          <span><i style={{background:"#e6d4f6"}} />Bewohnt</span>
          <span><i style={{background:"#fdf6f0"}} />Gemeinschaftsraum</span>
        </div>
      </div>

      {/* Custom rooms (annex) */}
      {customRooms.length > 0 && (
        <div className="fp-anbau-row">
          {customRooms.map(room => (
            <button key={room.id} className={`world-filter-btn ${selected === room.id ? "active" : ""}`}
              onClick={() => setSelected(selected === room.id ? null : room.id)}>
              {room.icon} {displayName(room)}
            </button>
          ))}
        </div>
      )}

      {/* Selected room detail */}
      {selectedRoom && (() => {
        const room = selectedRoom;
        const isEditing = editingRoom === room.id;
        const items = room.items || [];
        return (
          <div className="card" ref={detailRef} style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:"0.7rem",marginBottom:"0.2rem"}}>
              <span style={{fontSize:"1.4rem",lineHeight:1.1,flexShrink:0}}>{room.icon}</span>
              <div style={{flex:1}}>
                <p className="card-title">{displayName(room)}</p>
                <p className="card-meta">
                  {room.bedroom
                    ? (room.owner ? "✦ Bewohnt" : "✦ Frei")
                    : (items.length > 0 ? `${items.length} Gegenst${items.length === 1 ? "and" : "ände"}` : "Gemeinschaftsraum")}
                </p>
              </div>
              {room.custom && gmMode && !isEditing && <button className="btn-danger" title="Abreißen" onClick={() => deleteRoom(room)}>✕</button>}
              {canEditRoom(room) && !isEditing && <button className="card-act-edit" onClick={() => startEditRoom(room)}>✎</button>}
              <button className="btn-danger" title="Schließen" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="card-body">
              {isEditing ? (
                <>
                  {gmMode && (
                    <div className="f-group"><label className="f-label">Name</label>
                      <input className="f-input" value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} /></div>
                  )}
                  <div className="f-group"><label className="f-label">Beschreibung</label>
                    <RichEditor value={editForm.description} onChange={v => setEditForm(f=>({...f,description:v}))} placeholder="Wie sieht der Raum aus? Was macht ihn besonders?" rows={4} /></div>
                  <div className="f-actions">
                    <button className="btn-primary" onClick={() => saveEditRoom(room)}>Speichern</button>
                    <button className="btn-secondary" onClick={() => setEditingRoom(null)}>Abbrechen</button>
                  </div>
                </>
              ) : (
                <>
                  {room.description
                    ? <div className="narrative" dangerouslySetInnerHTML={{ __html: room.description }} />
                    : <p style={{fontFamily:"'IM Fell English',serif",fontStyle:"italic",color:"#c0a8d0",fontSize:"0.9rem",margin:0}}>
                        {room.bedroom && !room.owner ? "Ein leeres Zimmer, das auf jemanden wartet..." : "Noch keine Beschreibung."}
                      </p>
                  }

                  {/* Library book collection */}
                  {(room.library || room.id === "bibliothek") && (() => {
                    const books = [...(room.books || [])].sort((a, b) => (a.title || "").localeCompare(b.title || "", "de"));
                    const inp = bookInputs[room.id] || {};
                    if (books.length === 0 && !playerName && !gmMode) return null;
                    const readCount = books.filter(b => b.read).length;
                    return (
                      <>
                        <div className="divider" />
                        <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.5rem"}}>
                          📚 Büchersammlung{books.length > 0 ? ` · ${books.length} Band${books.length !== 1 ? "e" : ""}${readCount > 0 ? `, ${readCount} gelesen` : ""}` : ""}
                        </p>
                        {books.length > 0 && (
                          <div className="book-list">
                            {books.map(book => (
                              <div key={book.id} className="book-row">
                                <span className="book-spine">📖</span>
                                <div className="book-info">
                                  <p className="book-title">{book.title}</p>
                                  {book.author && <p className="book-author">von {book.author}</p>}
                                  {book.notes && <p className="book-notes">{book.notes}</p>}
                                  <p className="book-meta">Eingetragen von {book.addedBy}</p>
                                </div>
                                <div className="book-actions">
                                  <button className={`book-read ${book.read ? "read" : "unread"}`}
                                    onClick={() => toggleBookRead(room, book.id)}
                                    title="Gelesen-Status umschalten">
                                    {book.read ? "✓ Gelesen" : "○ Ungelesen"}
                                  </button>
                                  {(gmMode || book.addedBy === playerName) && (
                                    <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.4rem",color:"#c06080",borderColor:"#e0c0c8"}}
                                      onClick={() => removeBook(room, book.id)}>✕</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {(playerName || gmMode) && (
                          <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                              <input className="f-input" style={{flex:"2 1 160px"}} value={inp.title || ""}
                                onChange={e => setBookInputs(s => ({...s, [room.id]: {...(s[room.id]||{}), title: e.target.value}}))}
                                placeholder="Titel des Buches" />
                              <input className="f-input" style={{flex:"1 1 110px"}} value={inp.author || ""}
                                onChange={e => setBookInputs(s => ({...s, [room.id]: {...(s[room.id]||{}), author: e.target.value}}))}
                                placeholder="Autor (opt.)" />
                            </div>
                            <div style={{display:"flex",gap:"0.4rem"}}>
                              <input className="f-input" style={{flex:1}} value={inp.notes || ""}
                                onChange={e => setBookInputs(s => ({...s, [room.id]: {...(s[room.id]||{}), notes: e.target.value}}))}
                                onKeyDown={e => e.key === "Enter" && addBook(room)}
                                placeholder="Notizen / Inhalt (opt.)" />
                              <button className="btn-primary" style={{whiteSpace:"nowrap"}} onClick={() => addBook(room)}
                                disabled={!(inp.title || "").trim()}>+ Buch</button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Bedroom claiming */}
                  {room.bedroom && (
                    <div style={{marginTop:"0.8rem"}}>
                      {!room.owner && (
                        playerName
                          ? <button className="btn-primary" onClick={() => writeRoom(room, { owner: playerName })}>🔑 Zimmer beanspruchen</button>
                          : <button className="btn-add" onClick={needName}>Namen eingeben um ein Zimmer zu beanspruchen</button>
                      )}
                      {room.owner && (room.owner === playerName || gmMode) && (
                        <button className="btn-secondary" onClick={() => writeRoom(room, { owner: "" })}>Zimmer freigeben</button>
                      )}
                    </div>
                  )}

                  {/* Moodboard */}
                  {(() => {
                    const gallery = room.gallery || [];
                    const inp = imgInputs[room.id] || {};
                    if (gallery.length === 0 && !playerName && !gmMode) return null;
                    return (
                      <>
                        <div className="divider" />
                        <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.5rem"}}>📷 Moodboard</p>
                        {gallery.length > 0 && (
                          <div className="moodboard">
                            {gallery.map(img => (
                              <div key={img.id} className="mb-thumb" onClick={() => setLightbox(img)} title={img.caption || ""}>
                                <img src={img.url} alt={img.caption || "Moodboard-Bild"} onError={e => { e.target.style.display = "none"; }} />
                                {img.caption && <span className="mb-cap">{img.caption}</span>}
                                {(gmMode || img.addedBy === playerName) && (
                                  <button className="mb-del" title="Entfernen" onClick={e => { e.stopPropagation(); removeImage(room, img.id); }}>✕</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {(playerName || gmMode) && (
                          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                            <input className="f-input" style={{flex:"2 1 160px"}} value={inp.url || ""}
                              onChange={e => setImgInputs(s => ({...s, [room.id]: {...(s[room.id]||{}), url: e.target.value}}))}
                              placeholder="Bild-URL (i.imgur.com/...)" />
                            <input className="f-input" style={{flex:"1 1 110px"}} value={inp.caption || ""}
                              onChange={e => setImgInputs(s => ({...s, [room.id]: {...(s[room.id]||{}), caption: e.target.value}}))}
                              onKeyDown={e => e.key === "Enter" && addImage(room)}
                              placeholder="Bildunterschrift (opt.)" />
                            <button className="btn-primary" style={{whiteSpace:"nowrap"}} onClick={() => addImage(room)}
                              disabled={!(inp.url || "").trim()}>+ Bild</button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="divider" />
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.5rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#c0a8d0",marginBottom:"0.5rem"}}>Gegenstände & Einrichtung</p>
                  {items.length > 0 && (
                    <div className="impression-list" style={{marginBottom:"0.6rem"}}>
                      {items.map(item => (
                        <div key={item.id} className="impression">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.4rem"}}>
                            <span>{item.name}</span>
                            {(gmMode || item.addedBy === playerName) && (
                              <button className="btn-tiny btn-tiny-secondary" style={{padding:"0.1rem 0.35rem",color:"#c06080",borderColor:"#e0c0c8",flexShrink:0}}
                                onClick={() => removeItem(room, item.id)}>✕</button>
                            )}
                          </div>
                          <p className="impression-author">— {item.addedBy} · {formatDate(item.ts)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(playerName || gmMode) && (
                    <div style={{display:"flex",gap:"0.5rem"}}>
                      <input className="f-input" style={{flex:1}} value={itemInputs[room.id] || ""}
                        onChange={e => setItemInputs(s => ({...s, [room.id]: e.target.value}))}
                        onKeyDown={e => e.key === "Enter" && addItem(room)}
                        placeholder="Was steht hier herum?" />
                      <button className="btn-primary" style={{whiteSpace:"nowrap"}} onClick={() => addItem(room)}
                        disabled={!(itemInputs[room.id] || "").trim()}>+ Ablegen</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Moodboard lightbox */}
      {lightbox && (
        <div className="overlay" onClick={() => setLightbox(null)} style={{flexDirection:"column",cursor:"zoom-out"}}>
          <img className="mb-lightbox-img" src={lightbox.url} alt={lightbox.caption || "Moodboard-Bild"} onClick={e => e.stopPropagation()} />
          {lightbox.caption && <p className="mb-lightbox-cap">{lightbox.caption}</p>}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

// ── Rich Text Editor ─────────────────────────────────────────
const FONT_COLORS = [
  { label: "Standard",  value: null,      swatch: "#4a3a26" },
  { label: "Lila",      value: "#a67c1e", swatch: "#a67c1e" },
  { label: "Hellila",   value: "#c99a2e", swatch: "#c99a2e" },
  { label: "Gold",      value: "#b8860b", swatch: "#b8860b" },
  { label: "Elfenbein", value: "#8b7355", swatch: "#8b7355" },
  { label: "Rot",       value: "#c0392b", swatch: "#c0392b" },
  { label: "Blau",      value: "#3f7d5c", swatch: "#3f7d5c" },
  { label: "Grün",      value: "#3f7d5c", swatch: "#3f7d5c" },
  { label: "Grau",      value: "#8a7a5a", swatch: "#8a7a5a" },
];

function RichEditor({ value, onChange, placeholder, rows = 5 }) {
  const ref = useRef(null);
  const isInternalChange = useRef(false);
  const [bubble, setBubble] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !isInternalChange.current) {
      ref.current.innerHTML = value || "";
    }
    isInternalChange.current = false;
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setBubble(null);
        setShowColorPicker(false);
        setShowFormatPicker(false);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!ref.current || !ref.current.contains(range.commonAncestorContainer)) {
        setBubble(null);
        setShowColorPicker(false);
        setShowFormatPicker(false);
        return;
      }
      const rect = range.getBoundingClientRect();
      const wrapRect = wrapRef.current.getBoundingClientRect();
      setBubble({
        x: rect.left - wrapRect.left + rect.width / 2,
        y: rect.top - wrapRect.top,
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(ref.current.innerHTML);
  };

  const exec = (cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current.innerHTML);
  };

  const applyColor = (color) => {
    ref.current?.focus();
    document.execCommand("foreColor", false, color || "#4a3a26");
    onChange(ref.current.innerHTML);
    setShowColorPicker(false);
  };

  const applyFormat = (tag) => {
    ref.current?.focus();
    document.execCommand("formatBlock", false, tag);
    onChange(ref.current.innerHTML);
    setShowFormatPicker(false);
  };

  const FORMATS = [
    { label: "Normaler Text",  tag: "<p>",  preview: { fontFamily: "'IM Fell English', serif", fontSize: "0.95rem", fontWeight: 400 } },
    { label: "Überschrift 1",  tag: "<h1>", preview: { fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "1.15rem", fontWeight: 700, color: "#2c2117" } },
    { label: "Überschrift 2",  tag: "<h2>", preview: { fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "#8a6a1a" } },
    { label: "Überschrift 3",  tag: "<h3>", preview: { fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "#a67c1e" } },
  ];

  const tools = [
    { label: "B", title: "Fett",         cmd: "bold",               style: { fontWeight: 700 } },
    { label: "I", title: "Kursiv",        cmd: "italic",             style: { fontStyle: "italic" } },
    { label: "U", title: "Unterstrichen", cmd: "underline",          style: { textDecoration: "underline" } },
    { label: "•", title: "Aufzählung",    cmd: "insertUnorderedList",style: {} },
    { label: "⇥", title: "Einrücken",     cmd: "indent",             style: { fontSize: "0.9rem" } },
    { label: "⇤", title: "Ausrücken",     cmd: "outdent",            style: { fontSize: "0.9rem" } },
    { label: "—", title: "Trennlinie",    cmd: null,
      action: () => exec("insertHTML", "<hr style='border:none;border-top:1px solid #e5d6b8;margin:0.5rem 0;'>"),
      style: {} },
  ];

  return (
    <div ref={wrapRef} className="rich-editor-wrap" style={{ position: "relative" }}>
      {bubble && (
        <div
          style={{
            position: "absolute",
            left: bubble.x,
            top: bubble.y,
            transform: "translate(-50%, calc(-100% - 8px))",
            zIndex: 200,
            background: "#fbf4e6",
            border: "1px solid #ddcca6",
            borderRadius: "10px",
            padding: "0.3rem 0.4rem",
            display: "flex",
            gap: "0.2rem",
            alignItems: "center",
            boxShadow: "0 4px 20px rgba(170,140,70,0.25)",
            flexWrap: "nowrap",
            whiteSpace: "nowrap",
          }}
          onMouseDown={e => e.preventDefault()}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <button title="Textformat" className="rich-tool-btn"
              onMouseDown={e => { e.preventDefault(); setShowFormatPicker(v => !v); }}
              style={{ gap: "0.2rem", minWidth: "2.6rem", fontFamily: "'Cinzel', serif" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>H</span>
              <span style={{ fontSize: "0.55rem" }}>▾</span>
            </button>
            {showFormatPicker && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: 0,
                zIndex: 300,
                background: "#fbf4e6", border: "1px solid #e5d6b8", borderRadius: "8px",
                padding: "0.3rem", boxShadow: "0 6px 24px rgba(170,140,70,0.2)",
                display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: "130px",
              }}>
                {FORMATS.map(f => (
                  <button key={f.label}
                    onMouseDown={e => { e.preventDefault(); applyFormat(f.tag); }}
                    style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e5d6b8", borderRadius: "4px", cursor: "pointer", padding: "0.25rem 0.5rem", textAlign: "left", transition: "all 0.12s", ...f.preview }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c99a2e"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e5d6b8"}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rich-tool-divider" />
          {tools.map(t => (
            <button key={t.label} title={t.title} className="rich-tool-btn"
              onMouseDown={e => { e.preventDefault(); t.action ? t.action() : exec(t.cmd); }}
              style={t.style}>{t.label}</button>
          ))}
          <div style={{ position: "relative", display: "inline-block" }}>
            <button title="Schriftfarbe" className="rich-tool-btn"
              onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); }}
              style={{ gap: "0.25rem", minWidth: "2.4rem" }}>
              <span style={{ fontSize: "0.75rem" }}>A</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #c99a2e, #b8860b, #c0392b)", flexShrink: 0, display: "inline-block" }} />
            </button>
            {showColorPicker && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: "50%",
                transform: "translateX(-50%)", zIndex: 300,
                background: "#fbf4e6", border: "1px solid #e5d6b8", borderRadius: "8px",
                padding: "0.5rem", boxShadow: "0 6px 24px rgba(170,140,70,0.2)",
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.3rem", minWidth: "150px",
              }}>
                {FONT_COLORS.map(c => (
                  <button key={c.label} title={c.label}
                    onMouseDown={e => { e.preventDefault(); applyColor(c.value); }}
                    style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e5d6b8", borderRadius: "4px", cursor: "pointer", padding: "0.25rem 0.3rem", display: "flex", alignItems: "center", gap: "0.3rem", transition: "all 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c99a2e"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e5d6b8"}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.swatch, flexShrink: 0, border: c.value === null ? "1px solid #c0ad82" : "none" }} />
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.38rem", letterSpacing: "0.08em", color: c.swatch, whiteSpace: "nowrap", textTransform: "uppercase" }}>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid #ddcca6",
          }} />
        </div>
      )}
      <div ref={ref} className="rich-content" contentEditable suppressContentEditableWarning
        onInput={handleInput} data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.6}rem` }} />
    </div>
  );
}

export default RichEditor;

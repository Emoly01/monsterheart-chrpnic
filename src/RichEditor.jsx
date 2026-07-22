import { useState, useEffect, useRef } from "react";

// ── Rich Text Editor ─────────────────────────────────────────
const FONT_COLORS = [
  { label: "Standard",  value: null,      swatch: "#4a3a26" },
  { label: "Türkis",    value: "#12a39a", swatch: "#12a39a" },
  { label: "Gold",      value: "#e0a92e", swatch: "#e0a92e" },
  { label: "Ocker",     value: "#b8860b", swatch: "#b8860b" },
  { label: "Elfenbein", value: "#8b7355", swatch: "#8b7355" },
  { label: "Hibiskus",  value: "#e0456b", swatch: "#e0456b" },
  { label: "Koralle",   value: "#e8863a", swatch: "#e8863a" },
  { label: "Grün",      value: "#3f9d5c", swatch: "#3f9d5c" },
  { label: "Grau",      value: "#8a7a5a", swatch: "#8a7a5a" },
];

function RichEditor({ value, onChange, placeholder, rows = 5 }) {
  const ref = useRef(null);
  const isInternalChange = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFormatPicker, setShowFormatPicker] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !isInternalChange.current) {
      ref.current.innerHTML = value || "";
    }
    isInternalChange.current = false;
  }, [value]);

  // Close the open dropdowns when clicking anywhere outside a picker.
  useEffect(() => {
    if (!showColorPicker && !showFormatPicker) return;
    const onDown = (e) => {
      if (!e.target.closest?.(".rich-picker-anchor")) {
        setShowColorPicker(false);
        setShowFormatPicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showColorPicker, showFormatPicker]);

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
    document.execCommand("foreColor", false, color || "#2c2117");
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
    { label: "Überschrift 2",  tag: "<h2>", preview: { fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "#0d8a84" } },
    { label: "Überschrift 3",  tag: "<h3>", preview: { fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "#12a39a" } },
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
    <div className="rich-editor-wrap">
      {/* Always-visible toolbar so formatting is discoverable without
          selecting text first. */}
      <div className="rich-toolbar">
        <div className="rich-picker-anchor" style={{ position: "relative", display: "inline-block" }}>
          <button type="button" title="Textformat" className="rich-tool-btn"
            onMouseDown={e => { e.preventDefault(); setShowFormatPicker(v => !v); setShowColorPicker(false); }}
            style={{ gap: "0.2rem", minWidth: "2.6rem", fontFamily: "'Cinzel', serif" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>H</span>
            <span style={{ fontSize: "0.55rem" }}>▾</span>
          </button>
          {showFormatPicker && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
              background: "#fffaf0", border: "1px solid #e5d6b8", borderRadius: "8px",
              padding: "0.3rem", boxShadow: "0 6px 24px rgba(120,90,50,0.2)",
              display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: "140px",
            }}>
              {FORMATS.map(f => (
                <button type="button" key={f.label}
                  onMouseDown={e => { e.preventDefault(); applyFormat(f.tag); }}
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e5d6b8", borderRadius: "4px", cursor: "pointer", padding: "0.3rem 0.5rem", textAlign: "left", transition: "all 0.12s", ...f.preview }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#12a39a"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e5d6b8"}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rich-tool-divider" />
        {tools.map(t => (
          <button type="button" key={t.label} title={t.title} className="rich-tool-btn"
            onMouseDown={e => { e.preventDefault(); t.action ? t.action() : exec(t.cmd); }}
            style={t.style}>{t.label}</button>
        ))}
        <div className="rich-picker-anchor" style={{ position: "relative", display: "inline-block" }}>
          <button type="button" title="Schriftfarbe" className="rich-tool-btn"
            onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); setShowFormatPicker(false); }}
            style={{ gap: "0.25rem", minWidth: "2.4rem" }}>
            <span style={{ fontSize: "0.75rem" }}>A</span>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #12a39a, #e0a92e, #e0456b)", flexShrink: 0, display: "inline-block" }} />
          </button>
          {showColorPicker && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
              background: "#fffaf0", border: "1px solid #e5d6b8", borderRadius: "8px",
              padding: "0.5rem", boxShadow: "0 6px 24px rgba(120,90,50,0.2)",
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.3rem", minWidth: "160px",
            }}>
              {FONT_COLORS.map(c => (
                <button type="button" key={c.label} title={c.label}
                  onMouseDown={e => { e.preventDefault(); applyColor(c.value); }}
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e5d6b8", borderRadius: "4px", cursor: "pointer", padding: "0.25rem 0.3rem", display: "flex", alignItems: "center", gap: "0.3rem", transition: "all 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#12a39a"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e5d6b8"}>
                  <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: c.swatch, flexShrink: 0, border: c.value === null ? "1px solid #c0ad82" : "none" }} />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.4rem", letterSpacing: "0.06em", color: c.swatch, whiteSpace: "nowrap", textTransform: "uppercase" }}>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div ref={ref} className="rich-content" contentEditable suppressContentEditableWarning
        onInput={handleInput} data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.6}rem` }} />
    </div>
  );
}

export default RichEditor;

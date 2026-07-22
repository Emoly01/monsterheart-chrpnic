// The Haus tab is kept but intentionally empty for now, and only reachable in
// GM mode. It will be rebuilt later. Props are still accepted so App.jsx can
// pass its data through unchanged once content returns.
export default function HausTab() {
  return (
    <div className="page">
      <div className="section-hdr">
        <p className="section-title">🏡 Haus</p>
      </div>
      <div className="empty">
        Dieser Bereich wird gerade neu gebaut.<br />
        Bald mehr ✦
      </div>
    </div>
  );
}

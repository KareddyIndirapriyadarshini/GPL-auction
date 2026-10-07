export default function Header({ role, onExit, onReset }) {
  const label = role.type === "auctioneer"
    ? "Auctioneer"
    : role.type === "spectator"
      ? "Spectator"
      : role.teamName;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">GPL</span>
        <span className="brand-sub">AUCTION ROOM</span>
      </div>
      <div className="top-actions">
        <span className="live-dot"><i /> LIVE BOARD</span>
        <span className="role-pill">{label}</span>
        {role.type === "auctioneer" && (
          <button className="reset-button" onClick={onReset}>Reset auction</button>
        )}
        <button className="ghost-button" onClick={onExit}>Change role</button>
      </div>
    </header>
  );
}

export default function RolePicker({ onSelect }) {
  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="eyebrow">IIT GOA PREMIER LEAGUE</div>
        <h1>GPL <span>Auction Room</span></h1>
        <p className="muted">Pick a role to enter the auction. No account needed.</p>

        <div className="role-grid">
          <button className="role-card" onClick={() => onSelect({ type: "auctioneer" })}>
            <span className="role-icon">♛</span>
            <strong>Auctioneer</strong>
            <small>Run the room</small>
          </button>
          <button className="role-card" onClick={() => onSelect({ type: "manager", teamId: 1 })}>
            <span className="role-icon">01</span>
            <strong>Thunder Valley</strong>
            <small>Team manager</small>
          </button>
          <button className="role-card" onClick={() => onSelect({ type: "manager", teamId: 2 })}>
            <span className="role-icon">02</span>
            <strong>Silver Falcons</strong>
            <small>Team manager</small>
          </button>
          <button className="role-card" onClick={() => onSelect({ type: "manager", teamId: 3 })}>
            <span className="role-icon">03</span>
            <strong>Riverstone XI</strong>
            <small>Team manager</small>
          </button>
          <button className="role-card" onClick={() => onSelect({ type: "manager", teamId: 4 })}>
            <span className="role-icon">04</span>
            <strong>Golden Strikers</strong>
            <small>Team manager</small>
          </button>
          <button className="role-card spectator" onClick={() => onSelect({ type: "spectator" })}>
            <span className="role-icon">◉</span>
            <strong>Spectator</strong>
            <small>Just watching</small>
          </button>
        </div>
      </div>
    </main>
  );
}

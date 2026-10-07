export default function TeamRosters({ teams }) {
  return (
    <section className="roster-section">
      <div className="section-heading">
        <div><span className="eyebrow">THE FOUR SIDES</span><h2>Team rosters</h2></div>
        <span className="muted">Budget resets only when the auction ends.</span>
      </div>
      <div className="roster-grid">
        {teams.map((team, index) => {
          const spent = team.total_budget - team.remaining_budget;
          const percent = Math.round((team.remaining_budget / team.total_budget) * 100);
          return (
            <article className="team-card" key={team.id}>
              <div className="team-card-head">
                <div className={`team-badge badge-${index + 1}`}>{String(index + 1).padStart(2, "0")}</div>
                <div><h3>{team.name}</h3><span>{team.players.length} player{team.players.length !== 1 ? "s" : ""}</span></div>
              </div>
              <div className="budget-line"><span>₹{team.remaining_budget.toLocaleString()} left</span><span>₹{spent.toLocaleString()} spent</span></div>
              <div className="budget-bar"><i style={{ width: `${percent}%` }} /></div>
              <div className="roster-players">
                {team.players.length === 0 ? <span className="muted">No players yet</span> : team.players.map((player) => (
                  <div className="roster-player" key={player.id}>
                    <span><strong>{player.name}</strong><small>{player.skill}</small></span>
                    <strong>₹{player.sold_price.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

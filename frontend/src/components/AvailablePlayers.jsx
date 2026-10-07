export default function AvailablePlayers({ players, canStart, onStart }) {
  return (
    <section className="panel available-panel">
      <div className="panel-head">
        <div><span className="eyebrow">UP NEXT</span><h3>Available players</h3></div>
        <span className="count-pill">{players.length}</span>
      </div>
      <div className="player-list">
        {players.map((player, index) => (
          <button
            className="player-list-row"
            key={player.id}
            onClick={() => onStart(player.id)}
            disabled={!canStart}
            title={canStart ? "Start auction" : "Finish the current auction first"}
          >
            <span className="player-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="player-name"><strong>{player.name}</strong><small>{player.skill}</small></span>
            <span className="base-price">₹{player.base_price.toLocaleString()}</span>
            {canStart && <span className="arrow">→</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

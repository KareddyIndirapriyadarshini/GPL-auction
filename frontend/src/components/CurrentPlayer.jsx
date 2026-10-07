export default function CurrentPlayer({ player, bids, role, onAccept, onReject, onBid, bidAmount, setBidAmount, error }) {
  if (!player) {
    return (
      <section className="auction-stage empty-stage">
        <div className="empty-icon">+</div>
        <p className="eyebrow">WAITING FOR NEXT PLAYER</p>
        <h2>No active auction</h2>
        <p className="muted">The next player will appear here when the auctioneer starts the round.</p>
      </section>
    );
  }

  const highest = bids[0];
  const isManager = role.type === "manager";
  const leading = highest?.team_id === role.teamId;
  const heat = bids.length >= 5 ? "BIDDING WAR" : bids.length >= 3 ? "CONTESTED" : bids.length >= 1 ? "HEATING UP" : "CALM";

  return (
    <section className="auction-stage">
      <div className="stage-head">
        <span className="eyebrow">NOW ON THE BLOCK</span>
        <span className={`heat heat-${heat.replaceAll(" ", "-").toLowerCase()}`}>{heat}</span>
      </div>
      <div className="player-hero">
        <div>
          <span className="skill-tag">{player.skill}</span>
          <h2>{player.name}</h2>
          <p className="muted">Base price <strong>₹{player.base_price.toLocaleString()}</strong></p>
        </div>
        <div className="current-price">
          <span>{highest ? "CURRENT BID" : "STARTING AT"}</span>
          <strong>₹{(highest?.amount || player.base_price).toLocaleString()}</strong>
          {highest && <small>{highest.team_name}</small>}
        </div>
      </div>

      <div className="bid-trail">
        <div className="section-label">BID HISTORY <span>{bids.length}</span></div>
        {bids.length === 0 ? (
          <p className="muted empty-line">No bids yet. Who's opening?</p>
        ) : (
          bids.map((bid, index) => (
            <div className={`bid-row ${index === 0 ? "latest" : ""}`} key={bid.id}>
              <span>{index === 0 ? "LEADING" : `#${bids.length - index}`} · {bid.team_name}</span>
              <strong>₹{bid.amount.toLocaleString()}</strong>
            </div>
          ))
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {isManager && (
        <div className="bid-controls">
          <div className={`manager-status ${leading ? "leading" : ""}`}>
            {leading ? "✓ You're leading" : highest ? `Outbid by ${highest.team_name}` : "You're first up"}
          </div>
          <div className="bid-input-row">
            <span>₹</span>
            <input
              type="number"
              min={highest?.amount ? highest.amount + 1 : player.base_price + 1}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`min ₹${((highest?.amount || player.base_price) + 1).toLocaleString()}`}
              disabled={leading}
            />
            <button className="primary-button" disabled={leading || !bidAmount} onClick={onBid}>Place bid</button>
          </div>
        </div>
      )}

      {role.type === "auctioneer" && (
        <div className="auctioneer-actions">
          <button className="danger-button" onClick={onReject}>Reject round</button>
          <button className="primary-button" disabled={!highest} onClick={onAccept}>Accept ₹{highest?.amount?.toLocaleString() || "—"}</button>
        </div>
      )}
    </section>
  );
}

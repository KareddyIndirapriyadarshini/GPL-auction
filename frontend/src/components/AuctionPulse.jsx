export default function AuctionPulse({ teams, auction }) {
  const sold = teams.reduce((sum, team) => sum + team.players.length, 0);
  const spent = teams.reduce((sum, team) => sum + (team.total_budget - team.remaining_budget), 0);
  const sales = teams.flatMap((team) => team.players.map((p) => ({ ...p, team: team.name })));
  const biggest = [...sales].sort((a, b) => b.sold_price - a.sold_price)[0];

  return (
    <section className="pulse-grid">
      <div className="pulse-card"><span>PLAYERS SOLD</span><strong>{sold}<small> / 12</small></strong></div>
      <div className="pulse-card"><span>TOTAL SPENT</span><strong>₹{spent.toLocaleString()}</strong></div>
      <div className="pulse-card"><span>BIGGEST SALE</span><strong>{biggest ? `₹${biggest.sold_price.toLocaleString()}` : "—"}</strong><small>{biggest ? biggest.name : "No sale yet"}</small></div>
      <div className="pulse-card"><span>CURRENT BIDS</span><strong>{auction.bids.length}</strong><small>{auction.current_player ? auction.current_player.name : "Waiting"}</small></div>
    </section>
  );
}

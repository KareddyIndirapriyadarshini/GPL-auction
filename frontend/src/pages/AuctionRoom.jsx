import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import CurrentPlayer from "../components/CurrentPlayer";
import AvailablePlayers from "../components/AvailablePlayers";
import TeamRosters from "../components/TeamRosters";
import AuctionPulse from "../components/AuctionPulse";
import { acceptBid, getAuction, getTeams, placeBid, rejectBid, resetAuction, startAuction } from "../api/client";

export default function AuctionRoom({ role, onExit }) {
  const [auction, setAuction] = useState({ current_player: null, available_players: [], bids: [] });
  const [teams, setTeams] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextAuction, nextTeams] = await Promise.all([getAuction(), getTeams()]);
      setAuction(nextAuction);
      setTeams(nextTeams.teams);
    } catch (err) {
      setError("Could not reach the auction server. Is Flask running?");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const current = auction.current_player;
    const highest = auction.bids[0];
    if (current && highest && highest.team_id === role.teamId) setBidAmount("");
  }, [auction.current_player?.id, auction.bids[0]?.id, role.teamId]);

  const currentTeam = useMemo(() => teams.find((team) => team.id === role.teamId), [teams, role.teamId]);

  async function run(action, message) {
    setError("");
    try {
      await action();
      if (message) {
        setFlash(message);
        setTimeout(() => setFlash(""), 1800);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleBid() {
    run(() => placeBid(role.teamId, Number(bidAmount)), "Bid placed");
  }

  function handleReset() {
    if (!window.confirm("Reset the auction? This will clear all bids, unsell players, and restore every team's budget.")) {
      return;
    }
    setBidAmount("");
    run(() => resetAuction(), "Auction reset");
  }

  return (
    <div className="app-shell">
      <Header role={{ ...role, teamName: currentTeam?.name }} onExit={onExit} onReset={handleReset} />
      {flash && <div className="toast">✓ {flash}</div>}

      <main className="page">
        <div className="room-intro">
          <div>
            <span className="eyebrow">SEASON 01 · GPL</span>
            <h1>Let the bidding begin.</h1>
          </div>
          {currentTeam && (
            <div className="my-budget"><span>YOUR BUDGET</span><strong>₹{currentTeam.remaining_budget.toLocaleString()}</strong></div>
          )}
        </div>

        <AuctionPulse teams={teams} auction={auction} />

        <div className="main-grid">
          <AvailablePlayers
            players={auction.available_players}
            canStart={role.type === "auctioneer" && !auction.current_player}
            onStart={(id) => run(() => startAuction(id), "Auction started")}
          />
          <CurrentPlayer
            player={auction.current_player}
            bids={auction.bids}
            role={role}
            onAccept={() => run(() => acceptBid(), "Player sold")}
            onReject={() => run(() => rejectBid(), "Round rejected")}
            onBid={handleBid}
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            error={error}
          />
        </div>

        <TeamRosters teams={teams} />
      </main>
    </div>
  );
}

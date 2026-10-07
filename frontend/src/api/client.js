const API = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const getAuction = () => request("/auction");
export const getTeams = () => request("/teams");
export const startAuction = (playerId) => request("/auction/start", {
  method: "POST",
  body: JSON.stringify({ player_id: playerId }),
});
export const placeBid = (teamId, amount) => request("/auction/bid", {
  method: "POST",
  body: JSON.stringify({ team_id: teamId, amount }),
});
export const acceptBid = () => request("/auction/accept", { method: "POST" });
export const rejectBid = () => request("/auction/reject", { method: "POST" });
export const resetAuction = () => request("/auction/reset", { method: "POST" });

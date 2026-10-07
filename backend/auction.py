from datetime import datetime, timezone

from database import get_connection


class AuctionError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _current_player(conn):
    row = conn.execute("""
        SELECT p.*
        FROM auction_state a
        LEFT JOIN players p ON p.id = a.current_player_id
        WHERE a.id = 1
    """).fetchone()
    return row if row and row["id"] is not None else None


def _highest_bid(conn, player_id):
    return conn.execute(
        "SELECT b.*, t.name AS team_name FROM bids b JOIN teams t ON t.id = b.team_id "
        "WHERE b.player_id = ? ORDER BY b.amount DESC, b.id DESC LIMIT 1",
        (player_id,),
    ).fetchone()


def start_auction(player_id):
    conn = get_connection()
    try:
        if _current_player(conn):
            raise AuctionError("Finish the current auction before starting another one.")

        player = conn.execute("SELECT * FROM players WHERE id = ?", (player_id,)).fetchone()
        if not player:
            raise AuctionError("Player not found.", 404)
        if player["status"] != "available":
            raise AuctionError("That player is not available.")

        conn.execute("UPDATE players SET status = 'in auction' WHERE id = ?", (player_id,))
        conn.execute("UPDATE auction_state SET current_player_id = ? WHERE id = 1", (player_id,))
        conn.commit()
        return get_auction()
    finally:
        conn.close()


def place_bid(team_id, amount):
    conn = get_connection()
    try:
        player = _current_player(conn)
        if not player:
            raise AuctionError("There is no player in auction right now.")

        team = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
        if not team:
            raise AuctionError("Team not found.", 404)

        try:
            amount = int(amount)
        except (TypeError, ValueError):
            raise AuctionError("Enter a valid whole-number bid.")

        highest = _highest_bid(conn, player["id"])
        minimum = max(player["base_price"], highest["amount"] if highest else 0)

        if highest and highest["team_id"] == team_id:
            raise AuctionError("You're already leading. Wait for another team to bid.")
        if amount <= minimum:
            raise AuctionError(f"Bid must be higher than ₹{minimum:,}.")
        if amount > team["remaining_budget"]:
            raise AuctionError(
                f"That bid is above your remaining budget of ₹{team['remaining_budget']:,}."
            )

        conn.execute(
            "INSERT INTO bids (player_id, team_id, amount, time) VALUES (?, ?, ?, ?)",
            (player["id"], team_id, amount, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        return get_auction()
    finally:
        conn.close()


def accept_bid():
    conn = get_connection()
    try:
        player = _current_player(conn)
        if not player:
            raise AuctionError("There is no player in auction right now.")

        highest = _highest_bid(conn, player["id"])
        if not highest:
            raise AuctionError("There is no bid to accept.")

        team = conn.execute("SELECT * FROM teams WHERE id = ?", (highest["team_id"],)).fetchone()
        if highest["amount"] > team["remaining_budget"]:
            raise AuctionError("The winning bid is no longer within the team's budget.")

        conn.execute(
            "UPDATE teams SET remaining_budget = remaining_budget - ? WHERE id = ?",
            (highest["amount"], team["id"]),
        )
        conn.execute(
            "UPDATE players SET status = 'sold', sold_price = ?, team_id = ? WHERE id = ?",
            (highest["amount"], team["id"], player["id"]),
        )
        conn.execute("UPDATE auction_state SET current_player_id = NULL WHERE id = 1")
        conn.commit()
        return get_rosters()
    finally:
        conn.close()


def reject_bid():
    conn = get_connection()
    try:
        player = _current_player(conn)
        if not player:
            raise AuctionError("There is no player in auction right now.")

        conn.execute("DELETE FROM bids WHERE player_id = ?", (player["id"],))
        conn.execute("UPDATE players SET status = 'available' WHERE id = ?", (player["id"],))
        conn.execute("UPDATE auction_state SET current_player_id = NULL WHERE id = 1")
        conn.commit()
        return get_auction()
    finally:
        conn.close()


def reset_auction():
    conn = get_connection()
    try:
        conn.execute("DELETE FROM bids")
        conn.execute(
            """UPDATE players
               SET status = 'available', sold_price = NULL, team_id = NULL"""
        )
        conn.execute("UPDATE teams SET remaining_budget = total_budget")
        conn.execute("UPDATE auction_state SET current_player_id = NULL WHERE id = 1")
        conn.commit()
        return get_auction()
    finally:
        conn.close()


def get_auction():
    conn = get_connection()
    try:
        player = _current_player(conn)
        available = conn.execute(
            "SELECT id, name, skill, base_price, status FROM players WHERE status = 'available' ORDER BY id"
        ).fetchall()
        bids = []
        if player:
            bids = conn.execute(
                """SELECT b.id, b.team_id, t.name AS team_name, b.amount, b.time
                   FROM bids b JOIN teams t ON t.id = b.team_id
                   WHERE b.player_id = ? ORDER BY b.amount DESC, b.id DESC""",
                (player["id"],),
            ).fetchall()
        return {
            "current_player": dict(player) if player else None,
            "available_players": [dict(row) for row in available],
            "bids": [dict(row) for row in bids],
        }
    finally:
        conn.close()


def get_rosters():
    conn = get_connection()
    try:
        teams = conn.execute("SELECT * FROM teams ORDER BY id").fetchall()
        result = []
        for team in teams:
            players = conn.execute(
                """SELECT id, name, skill, sold_price FROM players
                   WHERE team_id = ? AND status = 'sold' ORDER BY id""",
                (team["id"],),
            ).fetchall()
            result.append({
                "id": team["id"],
                "name": team["name"],
                "total_budget": team["total_budget"],
                "remaining_budget": team["remaining_budget"],
                "players": [dict(row) for row in players],
            })
        return result
    finally:
        conn.close()

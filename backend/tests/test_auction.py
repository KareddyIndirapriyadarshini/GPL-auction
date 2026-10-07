import os
import sqlite3

import pytest

import database
from auction import AuctionError, accept_bid, place_bid, reject_bid, reset_auction, start_auction


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(database, "DB_PATH", db_file)
    database.init_db()
    yield


def test_only_higher_bids_are_accepted():
    start_auction(1)
    place_bid(1, 700)

    with pytest.raises(AuctionError, match="higher"):
        place_bid(2, 700)

    place_bid(2, 800)


def test_team_cannot_bid_twice_in_a_row():
    start_auction(1)
    place_bid(1, 700)

    with pytest.raises(AuctionError, match="already leading"):
        place_bid(1, 900)


def test_budget_is_checked():
    start_auction(1)
    with pytest.raises(AuctionError, match="remaining budget"):
        place_bid(1, 10001)


def test_accept_moves_player_to_roster_and_reduces_budget():
    start_auction(1)
    place_bid(1, 900)
    accept_bid()

    conn = database.get_connection()
    player = conn.execute("SELECT * FROM players WHERE id = 1").fetchone()
    team = conn.execute("SELECT * FROM teams WHERE id = 1").fetchone()
    auction = conn.execute("SELECT current_player_id FROM auction_state WHERE id = 1").fetchone()
    conn.close()

    assert player["status"] == "sold"
    assert player["team_id"] == 1
    assert player["sold_price"] == 900
    assert team["remaining_budget"] == 9100
    assert auction["current_player_id"] is None


def test_reject_keeps_player_available_and_spend_unchanged():
    start_auction(1)
    place_bid(1, 900)
    reject_bid()

    conn = database.get_connection()
    player = conn.execute("SELECT * FROM players WHERE id = 1").fetchone()
    team = conn.execute("SELECT * FROM teams WHERE id = 1").fetchone()
    conn.close()

    assert player["status"] == "available"
    assert player["team_id"] is None
    assert team["remaining_budget"] == 10000


def test_reset_restores_players_budgets_and_auction_state():
    start_auction(1)
    place_bid(1, 900)
    accept_bid()
    start_auction(2)
    place_bid(2, 700)

    reset_auction()

    conn = database.get_connection()
    players = conn.execute(
        "SELECT status, sold_price, team_id FROM players ORDER BY id"
    ).fetchall()
    teams = conn.execute(
        "SELECT remaining_budget, total_budget FROM teams ORDER BY id"
    ).fetchall()
    bids = conn.execute("SELECT COUNT(*) AS count FROM bids").fetchone()["count"]
    current_player_id = conn.execute(
        "SELECT current_player_id FROM auction_state WHERE id = 1"
    ).fetchone()["current_player_id"]
    conn.close()

    assert all(
        player["status"] == "available"
        and player["sold_price"] is None
        and player["team_id"] is None
        for player in players
    )
    assert all(team["remaining_budget"] == team["total_budget"] for team in teams)
    assert bids == 0
    assert current_player_id is None

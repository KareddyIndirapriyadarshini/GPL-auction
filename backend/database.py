import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "gpl.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        total_budget INTEGER NOT NULL CHECK(total_budget > 0),
        remaining_budget INTEGER NOT NULL CHECK(remaining_budget >= 0)
    );

    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        skill TEXT NOT NULL CHECK(skill IN ('batting', 'bowling', 'both')),
        base_price INTEGER NOT NULL CHECK(base_price > 0),
        status TEXT NOT NULL CHECK(status IN ('available', 'in auction', 'sold')),
        sold_price INTEGER,
        team_id INTEGER REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL REFERENCES players(id),
        team_id INTEGER NOT NULL REFERENCES teams(id),
        amount INTEGER NOT NULL CHECK(amount > 0),
        time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auction_state (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        current_player_id INTEGER REFERENCES players(id)
    );
    """)

    count = conn.execute("SELECT COUNT(*) AS count FROM teams").fetchone()["count"]
    if count == 0:
        teams = [
            (1, "Thunder Valley"),
            (2, "Silver Falcons"),
            (3, "Riverstone XI"),
            (4, "Golden Strikers"),
        ]
        conn.executemany(
            "INSERT INTO teams (id, name, total_budget, remaining_budget) VALUES (?, ?, 10000, 10000)",
            teams,
        )

    player_count = conn.execute("SELECT COUNT(*) AS count FROM players").fetchone()["count"]
    if player_count == 0:
        players = [
            (1, "Arjun Sharma", "batting", 600),
            (2, "Rajesh Kumar", "bowling", 550),
            (3, "Aditya Verma", "both", 800),
            (4, "Karan Singh", "batting", 700),
            (5, "Vikram Patel", "bowling", 500),
            (6, "Suresh Nair", "both", 750),
            (7, "Deepak Rao", "batting", 650),
            (8, "Rahul Mehta", "bowling", 450),
            (9, "Manoj Iyer", "both", 900),
            (10, "Nikhil Joshi", "batting", 500),
            (11, "Ritesh Shah", "bowling", 600),
            (12, "Prakash Yadav", "both", 700),
        ]
        conn.executemany(
            """INSERT INTO players
               (id, name, skill, base_price, status)
               VALUES (?, ?, ?, ?, 'available')""",
            players,
        )

    conn.execute("INSERT OR IGNORE INTO auction_state (id, current_player_id) VALUES (1, NULL)")
    conn.commit()
    conn.close()

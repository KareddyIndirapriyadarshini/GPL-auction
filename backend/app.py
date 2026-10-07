from flask import Flask, jsonify, request
from flask_cors import CORS

from auction import (
    AuctionError,
    accept_bid,
    get_auction,
    get_rosters,
    place_bid,
    reject_bid,
    reset_auction,
    start_auction,
)
from database import init_db

app = Flask(__name__)
CORS(app)
init_db()


def success(data):
    return jsonify(data)


def error_response(error):
    return jsonify({"error": error.message}), error.status_code


@app.get("/api/auction")
def auction():
    return success(get_auction())


@app.get("/api/teams")
def teams():
    return success({"teams": get_rosters()})


@app.post("/api/auction/start")
def start():
    try:
        body = request.get_json(silent=True) or {}
        return success(start_auction(body.get("player_id")))
    except AuctionError as exc:
        return error_response(exc)


@app.post("/api/auction/bid")
def bid():
    try:
        body = request.get_json(silent=True) or {}
        return success(place_bid(body.get("team_id"), body.get("amount")))
    except AuctionError as exc:
        return error_response(exc)


@app.post("/api/auction/accept")
def accept():
    try:
        return success({"teams": accept_bid()})
    except AuctionError as exc:
        return error_response(exc)


@app.post("/api/auction/reject")
def reject():
    try:
        return success(reject_bid())
    except AuctionError as exc:
        return error_response(exc)


@app.post("/api/auction/reset")
def reset():
    return success(reset_auction())


if __name__ == "__main__":
    app.run(debug=True, port=5000)

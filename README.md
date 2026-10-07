# GPL Auction Room

A small web auction for the IIT Goa Premier League (GPL) assignment.

The goal was to keep the implementation straightforward while making the actual auction experience feel polished. The server is the source of truth for bids, budgets, and player ownership.

## Stack

- **Frontend:** React + JavaScript + CSS, Vite
- **Backend:** Python + Flask
- **Database:** SQLite
- **Tests:** pytest
- **Live board updates:** Lightweight polling every 2 seconds
- **API communication:** Fetch

No WebSocket/SSE dependency is required.

---

## Run Locally

### Prerequisites

Make sure the following are installed:

- Python 3.10+
- Node.js 18+
- npm

Check the installations with:

```powershell
python --version
node --version
npm.cmd -v
```

### 1. Backend

Open a terminal in the project root (the folder containing this `README.md`), then go to the backend folder:

```powershell
cd backend
```

Create the Python virtual environment:

```powershell
python -m venv venv
```

Install the backend dependencies:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the Flask server:

```powershell
.\venv\Scripts\python.exe app.py
```

The backend normally runs at:

```text
http://localhost:5000
```

Keep this terminal running.

> **Windows note:** The commands above intentionally use the Python executable inside the virtual environment directly instead of activating the environment. This avoids PowerShell execution-policy issues on machines where `.ps1` scripts are restricted.

The SQLite database is created and seeded automatically on the first backend start.
Auction progress is saved between server restarts. Select the **Auctioneer** role and use **Reset auction** to clear bids, return all players to the available list, and restore team budgets.

### 2. Frontend

Open a **second terminal** in the project root, then go to the frontend folder:

```powershell
cd frontend
```

Install the frontend dependencies:

```powershell
npm.cmd install
```

Start the Vite development server:

```powershell
npm.cmd run dev
```

Open the URL shown in the terminal, normally:

```text
http://localhost:5173
```

Keep both the backend and frontend terminals running while using the application.

---

## Tests

The backend contains domain-level tests for the important auction rules.

From the project root:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
```

The tests cover:

- Increasing bids
- Preventing the leading team from bidding twice in a row
- Budget limits
- Accepting a player
- Rejecting an auction round

---

## Roles

The application supports three types of users:

### Auctioneer

The auctioneer can:

- Start an auction for an available player
- View the current bids
- Accept the highest bid
- Reject the current round
- Reset the auction to its starting state

### Team Manager

There are four team managers.

A team manager can:

- View the current auction
- Place bids for their team
- See their current budget
- See their team's roster
- See the auction state and bid history

### Spectator

A spectator can:

- View the current auction
- View available players
- View bids
- View team rosters and budgets

There is no signup, password reset, or real authentication system because authentication is outside the scope of the assignment.

---

## Auction Rules

The server validates the bidding rules rather than relying only on frontend validation.

- Each of the four teams starts with **₹10,000**.
- A bid must be strictly greater than the player's base price.
- Once bids exist, a new bid must also be strictly greater than the current highest bid.
- A team that currently has the highest bid cannot bid again until another team overtakes it.
- A team cannot bid above its remaining budget.
- Only one player can be in auction at a time.
- Accepting the highest bid assigns the player to that team.
- The accepted amount is deducted from the team's remaining budget.
- The sold player is removed from the available player list.
- Rejecting an auction round removes the bids from that round and returns the player to `available`.
- Rejecting a round does not deduct any team budget.
- Player data is preloaded. There is no player upload/edit screen.

---

## API

### `GET /api/auction`

Returns the current auction state, including the current player, available players, and bids.

**Success `200`**

```json
{
  "current_player": {
    "id": 1,
    "name": "Arjun Sharma",
    "skill": "batting",
    "base_price": 600
  },
  "available_players": [],
  "bids": []
}
```

---

### `GET /api/teams`

Returns all four teams, their remaining budgets, and their sold players.

**Success `200`**

```json
{
  "teams": []
}
```

**Success `200`**

The response contains the current team and roster information used by the frontend.

---

### `POST /api/auction/start`

Starts an auction for an available player.

**Request**

```json
{
  "player_id": 1
}
```

**Success `200`**

Returns the updated auction state.

**Errors**

- `400` — Another auction is already active or the player is not available.
- `404` — Player does not exist.

---

### `POST /api/auction/bid`

Places a bid for a team.

**Request**

```json
{
  "team_id": 1,
  "amount": 900
}
```

**Success `200`**

Returns the updated auction state.

**Errors**

- `400` — Invalid bid amount.
- `400` — No active auction.
- `400` — Bid is not above the current minimum.
- `400` — The team is already the highest bidder.
- `400` — Insufficient remaining budget.
- `404` — Team does not exist.

---

### `POST /api/auction/accept`

Accepts the current highest bid.

**Success `200`**

Returns the updated team roster and auction state.

**Errors**

- `400` — No active auction.
- `400` — There is no bid.
- `400` — The winning bid is not within the team's remaining budget.

---

### `POST /api/auction/reject`

Rejects the current auction round.

The player becomes available again and the round's bids are removed.

**Success `200`**

Returns the updated auction state.

**Errors**

- `400` — There is no active auction.

---

### `POST /api/auction/reset`

Resets auction progress: clears all bids, marks every player available, clears player ownership and sold prices, restores team budgets, and ends any active auction. Team and player names are preserved.

**Success `200`**

Returns the reset auction state.

---

## Database Schema

The application uses SQLite for persistent state.

### `teams`

| Field | Type | Constraint |
|---|---|---|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Required, unique |
| `total_budget` | INTEGER | Required, > 0 |
| `remaining_budget` | INTEGER | Required, >= 0 |

### `players`

| Field | Type | Constraint |
|---|---|---|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Required |
| `skill` | TEXT | `batting`, `bowling`, or `both` |
| `base_price` | INTEGER | Required, > 0 |
| `status` | TEXT | `available`, `in auction`, or `sold` |
| `sold_price` | INTEGER | Nullable |
| `team_id` | INTEGER | Nullable FK → `teams.id` |

### `bids`

| Field | Type | Constraint |
|---|---|---|
| `id` | INTEGER | Primary key |
| `player_id` | INTEGER | Required FK → `players.id` |
| `team_id` | INTEGER | Required FK → `teams.id` |
| `amount` | INTEGER | Required, > 0 |
| `time` | TEXT | Required |

### `auction_state`

| Field | Type | Constraint |
|---|---|---|
| `id` | INTEGER | Primary key, always 1 |
| `current_player_id` | INTEGER | Nullable FK → `players.id` |

---

## Live Updates

The auction board uses lightweight polling instead of WebSockets or Server-Sent Events.

The frontend checks the auction state approximately every **2 seconds**.

This keeps the implementation simple while still allowing different browser windows to observe changes during the auction.

No additional real-time infrastructure is required.

---

## UI Choices

The main differentiating features are deliberately small and tied directly to the auction.

### Bidding Heat

The room moves through:

```text
CALM
↓
HEATING UP
↓
CONTESTED
↓
BIDDING WAR
```

The state is derived from actual auction activity such as bid activity and participation.

### Manager Feedback

The current manager gets immediate feedback about their position:

- **You're leading**
- **You've been outbid**

This makes the manager view easier to understand during a fast auction.

### Budget Pulse

The current remaining budget and spent amount are visible throughout the auction.

This makes the financial constraint clear before placing another bid.

### Bid Trail

Recent bids are displayed as a compact bidding history, with the latest bid visually separated from older bids.

### Auction Pulse

The auction room provides a small overview of the current auction activity, including:

- Players sold
- Total amount spent
- Biggest sale
- Current bid activity

These values are derived from the actual auction state rather than invented player statistics.

### Clear Failure States

Invalid actions return contextual feedback instead of generic errors.

Examples include:

- Bid needs to be higher
- You are already leading
- Not enough remaining budget
- No auction is currently active

### Mobile Manager View

The manager interface is designed so the important bidding controls remain usable on narrow screens.

The application can be tested using browser mobile-device emulation as well as a real phone on the same local network.

None of these UI features changes the underlying assignment rules.

---

## Project Structure

```text
gpl-auction/
├── backend/
│   ├── app.py              # Flask application and HTTP routes
│   ├── auction.py          # Auction rules and database operations
│   ├── database.py         # SQLite setup and seed data
│   ├── requirements.txt    # Backend dependencies
│   └── tests/
│       └── test_auction.py # Auction domain tests
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Small Fetch API client
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Auction room and role views
│   │   └── styles/         # Responsive CSS
│   └── package.json
│
├── README.md
└── requirements.txt
```

---

## Testing the Main Flow

A basic manual test can be performed using multiple browser tabs.

### Auctioneer

1. Select Auctioneer from the role picker.
2. Start an auction for an available player.
3. Observe incoming bids.
4. Accept the highest bid or reject the round.

### Team Managers

Open separate browser tabs for the four team managers.

1. Select a team.
2. Place a valid bid.
3. Try bidding twice consecutively while still leading.
4. Try placing a bid above the team's remaining budget.
5. Observe the appropriate error message.
6. Continue bidding with another team.

### After Accepting

Verify that:

- The player is no longer available.
- The player appears on the winning team's roster.
- The accepted amount is deducted from that team's budget.
- Other teams' budgets remain unchanged.

### After Rejecting

Verify that:

- The player becomes available again.
- The round's bids disappear.
- No team's budget is reduced.

### Persistence

Refresh the browser after completing an auction and verify that the roster and budget state remains intact.

---

## Responsive Testing

The frontend can be tested on desktop and mobile layouts.

In Chrome:

1. Open the application.
2. Press `F12`.
3. Select the device/mobile toolbar.
4. Test different phone widths.

The manager controls should remain usable on narrow screens.

For testing on a real phone, run the frontend using a host accessible from the local network:

```powershell
npm.cmd run dev -- --host
```

Then use the laptop's local IP address from the phone while both devices are connected to the same Wi-Fi network.

---

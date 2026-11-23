# SQLite schema

SQLite stores one board row per user. The row contains a JSON document matching the frontend's ordered `columns` array and `cards` object keyed by card ID. The board API loads and saves a complete snapshot in one operation.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
);

CREATE TABLE boards (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    board_json TEXT NOT NULL CHECK (json_valid(board_json)),
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
```

FastAPI opens SQLite through Python's built-in `sqlite3` module. On startup it creates the tables if needed and inserts the demo user and starter board if they are missing. Each connection enables foreign keys. The users table stores the identity, and the backend checks the local MVP credentials.

Inside Docker, the file is `/data/db.sqlite3`. The `kanban-data` named volume mounts at `/data` and keeps the file across container rebuilds. When running the backend directly, the default is `backend/db.sqlite3`. Set `KANBAN_DB` to override the file path.

Columns keep the demo's five IDs and their order. A column has an editable title and an ordered list of card IDs. A card has an ID, title, and details. Validate that every card appears in exactly one column, that all referenced cards exist, and that each card key matches its ID. Manual edits can remove cards and rename columns. Validate AI proposals against the current board to limit them to creating, editing, and moving cards.

GET returns the board and its revision. Manual saves and AI updates use a conditional SQL update keyed by both user ID and the expected revision. Each successful write increments the revision. A stale write returns HTTP 409, allowing the frontend to reload the latest saved board. A chat call reads the revision before contacting the provider and uses it when applying the update.

Conversation history stays in browser memory and clears on reload or sign-out.

# Proposed SQLite schema

Store one board per user as JSON in SQLite. The existing frontend already represents a board with an ordered `columns` array and a `cards` object keyed by card ID. Keeping that shape lets the board API load and save a complete snapshot in one operation.

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

Enable foreign keys on each connection. Create tables and seed the MVP user and demo board on startup if absent. The local MVP credentials are validated by the backend, so the users table only stores the user identity. Put the SQLite file on the Docker volume.

Columns keep the demo's five IDs and their order. A column has an editable title and an ordered list of card IDs. A card has an ID, title, and details. Validate that every card appears in exactly one column, that all referenced cards exist, and that each card key matches its ID. Manual edits can remove cards and rename columns. Validate AI proposals against the current board to limit them to creating, editing, and moving cards.

GET returns the board and its revision. Manual saves and AI updates use a conditional SQL update keyed by both user ID and the expected revision. Each successful write increments the revision. A stale write returns HTTP 409, allowing the frontend to reload the latest saved board. A chat call reads the revision before contacting the provider and uses it when applying the update.

Conversation history stays in browser memory for the signed-in session. Only the board is stored in SQLite.

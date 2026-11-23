# Backend

FastAPI runs from `main.py` and serves the static frontend after registering the API routes. `board.py` validates the board shape and persists snapshots in SQLite using revision checks. `seed.json` supplies the demo board on first startup. `ai.py` calls OpenRouter and applies structured card operations to a copy of the current board.

Run `uv run --locked pytest` from this directory. Tests use temporary databases and mocked provider calls.

# Kanban Studio

Run `pwsh -File scripts/start.ps1` on Windows or `sh scripts/start.sh` on macOS and Linux. Docker with Compose is required. Open http://127.0.0.1:8000 and sign in with `user` and `password`.

Set `OPENROUTER_API_KEY` in `.env` to enable chat. Set `KANBAN_PORT` to change the host port. Stop with the corresponding `stop` script. The Compose volume retains the board.

Set `SESSION_SECRET` in `.env` to keep sessions valid across container restarts.

See the [project documentation](docs/README.md) for architecture, the API, database details, and troubleshooting.

## Checks

- Backend from `backend/` with `uv run --locked pytest`.
- Frontend from `frontend/` with Node 24 and `npm ci`, then `npm run lint` and `npm run test:unit`.
- Browser tests from `frontend/` with `npx playwright install chromium` and `npm run test:e2e` against a running app. They write test cards and restore column titles. Run them against a test instance. Set `KANBAN_URL` for a different address.
- Live OpenRouter check from the project root with `docker compose exec kanban .venv/bin/python check_ai.py`.

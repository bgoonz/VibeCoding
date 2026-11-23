# Local development and operations

## Start and use the app

Run commands from `pm/` with Docker and the Compose plugin running. Use the script pair for your shell.

| Platform | Start | Stop |
| --- | --- | --- |
| Windows PowerShell | `pwsh -File scripts/start.ps1` | `pwsh -File scripts/stop.ps1` |
| macOS or Linux | `sh scripts/start.sh` | `sh scripts/stop.sh` |

Start builds the image and waits for the health check. Open [Kanban Studio](http://127.0.0.1:8000/) and sign in with `user` and `password`. Use a column title field to rename it, **Add a card** to create a card, and **Edit** or **Remove** to change one. Drag a card by its title and details to reorder it or move it to a different column. Use **Sign out** to end the session.

## Configuration

Put local settings in `pm/.env`. Compose loads that file from the project directory. The Docker build excludes it.

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Server-side key required for assistant replies |
| `KANBAN_PORT` | Host port published on loopback, defaulting to `8000`. Uvicorn still listens on container port `8000`. |
| `SESSION_SECRET` | Optional stable signing secret. With no configured secret, the backend generates one at startup and existing cookies expire when the backend restarts. |

After configuration or code changes, rerun the start script to pick them up. For frontend development, start Docker, then run `npm ci` and `npm run dev` in `frontend/` with Node 24. Open `http://localhost:3000`. Next.js proxies `/api` requests to `http://127.0.0.1:8000` by default. Set `KANBAN_URL` if the backend uses another port.

## Checks

| Check | Working directory | Command |
| --- | --- | --- |
| FastAPI and SQLite | `pm/backend/` | `uv run --locked pytest` |
| Frontend lint and unit tests | `pm/frontend/` | `npm ci`, then `npm run lint` and `npm run test:unit` |
| Static export | `pm/frontend/` | `npm run build` |
| Chromium browser tests | `pm/frontend/` | `npx playwright install chromium`, then `npm run test:e2e` |
| Live OpenRouter smoke check | `pm/` | `docker compose exec kanban .venv/bin/python check_ai.py` |

The backend tests use temporary databases and mock the provider. Playwright runs in headless Chromium against a running app. Use a test instance because the browser suite writes cards and changes column titles. Set `KANBAN_URL` to the test instance URL before running the suite. The live check sends a math question and a structured update request against the demo fixture in memory.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Browser shows `ERR_CONNECTION_REFUSED` or `Failed to fetch` | Run `docker compose ps` in `pm/` to confirm the published port and container health. An old tab from a stopped test instance can still display the board. Open the URL reported by Compose. |
| Docker reports a startup failure | Run `docker compose logs kanban` and check `/api/health` on the published host port. |
| Chat says OpenRouter is unconfigured | Set `OPENROUTER_API_KEY` in `pm/.env` and rerun the start script. Use the live smoke check to verify the key and model. |
| The board changed during a save | Another tab or request saved a newer revision. The app loads the latest saved board. Retry the edit from that state. |
| The browser still shows old behavior after rebuilding | Reload the app on the current Compose port to fetch the latest frontend assets. |

SQLite lives at `/data/db.sqlite3` in the container. Docker manages the named volume outside the checkout. The stop scripts preserve the volume, and `docker compose down -v` deletes it along with the saved board.

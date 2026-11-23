# Project Management MVP implementation plan

## Part 1. Plan and review

- [x] Inspect the demo and document its structure in `frontend/AGENTS.md`.
- [x] Define implementation steps, tests, and success criteria for all ten parts.
- [x] Get user approval for this detailed plan before implementation.

**Verification.** Review the checklist against `AGENTS.md` and the existing frontend entry points. Part 1 is complete when the user approves the plan.

## Part 2. Docker and FastAPI

- [x] Add a multi-stage Docker build and a Compose service. Install locked Python dependencies with uv and use a named volume for SQLite.
- [x] Create the FastAPI application in `backend/`. Verify it can serve temporary HTML at `/` alongside `GET /api/health`.
- [x] Add PowerShell scripts for Windows and shell scripts for macOS and Linux under `scripts/`. Resolve the project directory from the script location. Keep the database volume on stop.
- [x] Pass the OpenRouter key to the runtime from the existing project `.env`. Exclude the file from the build context.

**Verification.** Build and start Docker, load the HTML, call the health endpoint, then stop and restart with the scripts. Confirm the service responds on localhost and document which host platforms were exercised.

## Part 3. Static frontend

- [x] Configure Next.js static export and copy the result into the FastAPI image. Serve the export at `/` with its assets and keep API routes reachable.
- [x] Preserve the existing palette and board interactions. Add title and details editing to existing cards.
- [x] Keep the demo seed available until API integration.

**Verification.** Run lint, frontend unit tests, the export build, and browser tests. Verify five fixed columns, rename, add, edit, remove, reorder, and cross-column drag. Confirm Docker serves the board with its styles and JavaScript.

## Part 4. MVP sign-in

- [x] Add same-origin login, session lookup, and logout endpoints. Validate `user` and `password` in FastAPI and use a signed HTTP-only session cookie.
- [x] Show a sign-in form on the first visit. Restore the session on refresh and return to sign-in on logout.
- [x] Require authentication for board and chat routes when introduced.

**Verification.** Test successful and failed credentials, missing or invalid cookies, session restoration, and logout. Verify signed-out users cannot use the board and refreshing after logout shows sign-in.

## Part 5. SQLite schema and review

- [x] Draft the [SQLite schema and board format](./DATABASE.md).
- [x] Get user sign-off on the schema before implementing storage.

**Verification.** Review the proposal against the existing TypeScript board model. Confirm the schema supports one board per user, fixed column identities, ordered cards, and conflict detection.

## Part 6. Board API

- [x] Initialize SQLite and idempotently seed the MVP user and demo board.
- [x] Add authenticated `GET /api/board` and `PUT /api/board`. Validate the board and apply revision checks as part of the write.
- [x] Use the session user for all reads and writes.

**Verification.** Use temporary SQLite databases to test startup, restart, seeding, authentication, ownership, valid saves, invalid board references, and stale revisions. Confirm a rejected write leaves the previous board intact.

## Part 7. Persistent frontend

- [x] Load the signed-in user's board from the API and save board changes through the same API.
- [x] Allow one board write at a time and show loading, save failure, and conflict feedback. Reload the current board on conflict.
- [x] Document local start, stop, and test commands in a minimal project README.

**Verification.** Exercise add, edit, remove, rename, reorder, and drag in a browser, then reload and verify each saved change. Verify persistence across a container restart and test a stale write from another browser tab.

## Part 8. OpenRouter connectivity

- [x] Connect the FastAPI backend to OpenRouter using `openai/gpt-oss-120b` and the runtime API key.
- [x] Provide a repeatable connectivity check that asks `2+2` and verifies a response of `4`.
- [x] Test missing credentials, timeouts, and provider errors using a mocked transport.

**Verification.** Run the mocked tests and the live check with the configured key. Confirm credentials stay on the server and report any provider issue that prevents live verification.

## Part 9. Structured chat and board updates

- [x] Add an authenticated chat endpoint that sends the latest saved board, conversation history, and current user message to OpenRouter.
- [x] Request a structured response with a text reply and optional create, edit, and move operations. Apply the operations to a copy of the board and validate it before saving.
- [x] Save a valid update only if the board revision still matches the version sent to the model. Return the updated board and revision so the client can render them.

**Verification.** Mock responses for reply-only chat, valid changes to multiple cards, malformed output, unsupported changes, provider failure, and a concurrent manual edit. Confirm failed proposals leave the database intact and inspect a live structured response.

## Part 10. Chat sidebar

- [x] Add an accessible, responsive chat sidebar using the board's palette. Render conversation history, input, pending state, and errors.
- [x] Enable sending chat once pending board saves finish. Render returned board updates automatically. Reset the in-memory conversation on logout.
- [x] Verify the full app through its Docker entry point.

**Verification.** In browser tests, sign in, send a question, confirm history reaches the next request, and verify that a chat update appears on the board and survives reload. Test provider failure and inspect usability at desktop and narrow widths.

## Verification results

- FastAPI tests passed (18). Frontend lint, TypeScript, and unit tests passed (7).
- Chromium tests passed against the Docker image (4). They covered sign-in, sign-out, durable card and column changes, stale saves, and chat updates. The sidebar layout was checked at desktop and narrow widths.
- Both start and stop script pairs ran on Windows using PowerShell and Git Bash. The same SQLite board and revision survived both restarts.
- Live OpenRouter checks returned `4` for `2+2` and a valid structured card creation on the demo board.

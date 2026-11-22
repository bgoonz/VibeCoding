# Kanban MVP plan

## Phase 1 - Scaffold
- [x] Next.js app in `frontend` (TypeScript, App Router, Tailwind)
- [x] `.gitignore` covers dependencies, build output, and test artifacts
- [x] Minimal README

## Phase 2 - Board logic and unit tests
- [x] One board, five columns, cards with title and details only
- [x] Dummy data for first load
- [x] Rename column, add card, delete card, move card
- [x] Unit tests cover those operations
- [x] `npm test` passes

## Phase 3 - Interface
- [x] Client-rendered board using the specified color scheme
- [x] Columns can be renamed
- [x] Cards can be added and deleted
- [x] Dummy data is visible on open
- [x] No archive, search, filter, persistence, or accounts

## Phase 4 - Drag and drop
- [x] Cards move between columns and reorder within a column

## Phase 5 - Integration tests
- [x] Playwright covers load, rename, add, delete, and drag
- [x] Defects found by those tests are fixed
- [x] `npm run test:e2e` passes

## Phase 6 - Ready
- [x] Dev server is running for use

# Kanban MVP plan

## Phase 1 - Scaffold
- [ ] Next.js app in `frontend` (TypeScript, App Router, Tailwind)
- [ ] `.gitignore` covers dependencies, build output, and test artifacts
- [ ] Minimal README

## Phase 2 - Board logic and unit tests
- [ ] One board, five columns, cards with title and details only
- [ ] Dummy data for first load
- [ ] Rename column, add card, delete card, move card
- [ ] Unit tests cover those operations
- [ ] `npm test` passes

## Phase 3 - Interface
- [ ] Client-rendered board using the specified color scheme
- [ ] Columns can be renamed
- [ ] Cards can be added and deleted
- [ ] Dummy data is visible on open
- [ ] No archive, search, filter, persistence, or accounts

## Phase 4 - Drag and drop
- [ ] Cards move between columns and reorder within a column

## Phase 5 - Integration tests
- [ ] Playwright covers load, rename, add, delete, and drag
- [ ] Defects found by those tests are fixed
- [ ] `npm run test:e2e` passes

## Phase 6 - Ready
- [ ] Dev server is running for use

# Frontend

This is a Next.js App Router static export with TypeScript, Tailwind CSS, and dnd-kit. `src/app/page.tsx` renders the client-side `Workspace`, which restores the session and calls the same-origin FastAPI endpoints. `src/app/layout.tsx` sets metadata and fonts. `src/app/globals.css` defines the palette and shared styles.

`KanbanBoard` owns the drag handlers and renders the controlled board supplied by `Workspace`. `KanbanColumn` handles column titles and renders cards. `KanbanCard` handles drag, edit, and remove controls. `KanbanCardPreview` renders the drag overlay, `NewCardForm` handles new cards, and `ChatSidebar` displays conversation and accepts messages.

`src/lib/kanban.ts` defines the board types, demo test data, card IDs, and movement logic. Column order is stored in an array and card order in each column's `cardIds`.

Use Node 24 and run `npm ci` from this directory. Run `npm run lint` and `npm run test:unit` locally. Run `npm run test:e2e` against the Docker app on a test instance. Build the export with `npm run build`.

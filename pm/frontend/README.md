# Kanban Studio

See the [project README](../README.md) for Docker and test commands.

For frontend development, start the Docker app, then run `npm ci` and `npm run dev` with Node 24. Open http://localhost:3000. The dev server proxies API requests to http://127.0.0.1:8000. Set `KANBAN_URL` before starting Next.js to use a different backend address.

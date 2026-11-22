# Bryan Guner

Portfolio site built with Next.js from the LinkedIn profile export in this folder.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Requires Node.js 20.9 or newer.

## Chat ("talk to Bryan")

The site is a static export hosted on GitHub Pages. The chat widget calls a Cloudflare Worker
(`worker/`) that holds the OpenRouter key as a secret, so the key never reaches the browser.
The Worker only accepts requests from the origins listed in `worker/wrangler.toml`.

GitHub repo setup (Settings → Secrets and variables → Actions):
- Secrets: `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`, `OPENROUTER_API_KEY`
- Variable: `CHAT_API_URL` = the Worker URL, e.g. `https://bryan-guner-chat.<subdomain>.workers.dev`
- Settings → Pages → Source: GitHub Actions

Local dev (Node 20+): `cd worker && npx wrangler dev` (put the key in `worker/.dev.vars`), then `npm run dev`.

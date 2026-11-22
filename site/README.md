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
The Worker only accepts browser requests from `https://bgoonz.github.io` and rate-limits each
IP to 10 messages per minute. It answers from `data/profile.ts` (minus the phone number).

GitHub repo setup (Settings → Secrets and variables → Actions):
- Secrets: `CLOUDFLARE_API_TOKEN` (Workers edit), `CLOUDFLARE_ACCOUNT_ID`, `OPENROUTER_API_KEY`
- Variable: `CHAT_API_URL` = `https://bryan-guner-chat.bryan-guner-dev.workers.dev` (the build fails without it)
- Settings → Pages → Source: GitHub Actions

## Deploys

`.github/workflows/deploy-site.yml` runs on pushes to `master` that touch `site/**` (or the
workflow itself), plus manual runs from the Actions tab. Changes elsewhere in the repo never
deploy. The Worker is only redeployed when `site/worker/` or `site/data/` changed.

## Local development (Node 20.9+)

```bash
# terminal 1: the chat Worker on http://localhost:8787
cd worker
npm install
echo OPENROUTER_API_KEY=sk-or-... > .dev.vars
npm run dev

# terminal 2: the site on http://localhost:3000
npm run dev
```

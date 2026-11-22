# Code Review: `site/`

**Date:** 2026-11-22
**Scope:** Next.js static site (`app/`, `data/`), chat Cloudflare Worker (`worker/`), deploy workflow (`.github/workflows/deploy-site.yml`).
**Live:** https://bgoonz.github.io/VibeCoding/ and Worker `https://bryan-guner-chat.bryan-guner-dev.workers.dev`

## Resolution status (2026-11-22)

All findings were applied except the ones that need action outside the code:

- **Fixed in code:** S1 (per-IP rate limit, 10/min), S2 (localhost only in `env.dev`), S3, S4 (phone omitted from prompt), S6 (actions pinned to SHAs, wrangler pinned via `worker/package-lock.json`), C1 (build fails without `CHAT_API_URL`; the localhost fallback is dev-only), C2, C3 (errors kept out of model history), C4 (20s timeout → 504, plus a 64 KB body cap), C5 (Pages deploy needs only `build`; the Worker deploys only when `site/worker/` or `site/data/` change), C7 (named `linkedin`/`github` fields), A1–A4, M1, M2 (`worker/package.json` + `tsconfig.json` + `@cloudflare/workers-types`, type-checked in CI), M3 (Open Graph/Twitter metadata).
- **Kept as-is (by design):** C6, the secret sync runs on each Worker deploy so GitHub stays the source of truth.
- **Needs you:** S5, put the current key in `site/.env` (or delete it) and delete the unused OpenRouter keys. M4, install Node 22 LTS to run the site locally.

## Summary

The site is small, readable and well structured: content lives in one data file (`data/profile.ts`), the page is plain semantic HTML, and the CSS uses a consistent token set. The chat is built the right way for a static host. The OpenRouter key is only in GitHub/Cloudflare secrets, never in the bundle. I confirmed that by searching the live JS.

There are no critical bugs. The main risks are **cost abuse of the Worker** (the `Origin` check alone can't stop a script) and a few **robustness gaps** in the widget and the build. Severity key: 🔴 high · 🟠 medium · 🟡 low · ⚪ nit.

## Security & cost

| # | Sev | Where | Finding | Suggested fix |
|---|-----|-------|---------|---------------|
| S1 | 🟠 | `worker/src/index.ts` | The `Origin` allow-list only stops *browsers* on other sites. A script can send `Origin: https://bgoonz.github.io` and call the Worker freely. Each call spends OpenRouter credit. The $5 key cap limits the damage, but once it's hit the chat goes down for everyone. | Add per-IP rate limiting: the Workers Rate Limiting binding (`[[unsafe.bindings]] type = "ratelimit"`) or a Cloudflare WAF rate-limit rule, e.g. 10 requests/min per IP. Optionally add Cloudflare Turnstile to the widget. |
| S2 | 🟡 | `worker/src/index.ts` | `ALLOWED_ORIGINS` includes `http://localhost:3000` in production. It's harmless given S1, but it's unnecessary surface. | Move localhost into a `[env.dev]` block in `wrangler.toml`. |
| S3 | 🟡 | `worker/src/index.ts:83` | The error response includes `upstream: <status>`. I added it for debugging the 401. It leaks no secret, but it tells callers about the backend. | Remove `upstream` now that the key works. Keep the `console.error` for logs. |
| S4 | 🟡 | `data/profile.ts` + system prompt | The entire profile, including **phone number**, goes into the prompt, so the bot will give the number to anyone who asks. It's already shown on the page, so this is a choice, not a leak. | If you'd rather not, omit `phone`/`phoneHref` when building the prompt. |
| S5 | 🟡 | `site/.env` | The key in `.env` is the old, rejected key. `.env` is git-ignored, which is correct. | Replace it with the current key (or delete the file) and revoke the old OpenRouter keys "testing" and "VibeCoding portfolio chat". |
| S6 | ⚪ | Workflow | Actions are pinned to tags (`@v4`) and `wrangler@4` floats. That's typical, but a compromised tag could see your secrets. | Pin actions to commit SHAs and wrangler to an exact version. |

## Correctness & robustness

| # | Sev | Where | Finding | Suggested fix |
|---|-----|-------|---------|---------------|
| C1 | 🟠 | `app/ChatWidget.tsx:5` | `CHAT_URL` falls back to `http://localhost:8787`. If the `CHAT_API_URL` repo variable is ever missing, the build succeeds but the live chat quietly calls localhost and fails. | Fail the build when it's unset in CI, e.g. a check step in the workflow (`test -n "$NEXT_PUBLIC_CHAT_URL"`), or only use the fallback when `NODE_ENV === "development"`. |
| C2 | 🟡 | `app/ChatWidget.tsx` | `await res.json()` throws on non-JSON responses (the Worker's 403 is plain text "Forbidden"). The user then sees "I couldn't connect", which is misleading. | Check `res.ok` / `content-type` before parsing, and show a "Chat is unavailable" message. |
| C3 | 🟡 | `app/ChatWidget.tsx` | Error strings are added to `messages` as `assistant` turns and then sent back to the model as history. | Keep errors in separate UI state, or filter them out before sending. |
| C4 | 🟡 | `worker/src/index.ts` | The `fetch` to OpenRouter has no timeout. A slow upstream leaves the user on "Typing…" indefinitely. | Pass `signal: AbortSignal.timeout(20000)` and return 504 on abort. |
| C5 | 🟡 | `.github/workflows/deploy-site.yml` | The `deploy` job `needs: [worker, build]`, so a Cloudflare outage or token problem blocks *all* site updates, even content-only edits. | Make `deploy` need only `build`, or run the worker job only when `site/worker/**` or `site/data/**` changes. |
| C6 | ⚪ | Workflow | `wrangler secret put` runs on every deploy, which is redundant once the secret is set. | Fine as-is (it keeps the key in sync with GitHub), or move it to a manual `workflow_dispatch` job. |
| C7 | ⚪ | `app/page.tsx` (Contact) | `profile.links[1]` / `links[2]` pick LinkedIn/GitHub by array position. Reordering `links` silently breaks Contact. | Look them up by label, or add named fields (`linkedin`, `github`) to `profile`. |

## Accessibility & UX

| # | Sev | Where | Finding | Suggested fix |
|---|-----|-------|---------|---------------|
| A1 | 🟡 | `ChatWidget.tsx` | Escape doesn't close the panel, and focus isn't returned to the toggle button on close. | Add an Escape key handler and refocus the toggle on close. |
| A2 | 🟡 | `ChatWidget.tsx` | The toggle button sets `aria-expanded` but has no `aria-controls` pointing at the panel. | Give the panel an `id` and set `aria-controls`. |
| A3 | ⚪ | `globals.css` | The floating chat button can cover the footer text on small screens. | Add bottom padding to `.page` (~80px) on mobile. |
| A4 | ⚪ | `globals.css` | No `prefers-reduced-motion` guard for `scroll-behavior: smooth` / smooth chat scrolling. | Wrap them in `@media (prefers-reduced-motion: no-preference)`. |

## Maintainability

| # | Sev | Where | Finding | Suggested fix |
|---|-----|-------|---------|---------------|
| M1 | ⚪ | `globals.css` | The `.facts` / `.facts dt` / `.facts dd` selectors aren't used by any markup. | Remove the dead CSS. |
| M2 | ⚪ | `worker/` | It has no `package.json` / `@cloudflare/workers-types`, so the Worker is type-checked against DOM types only, and it's excluded from the root `tsconfig`. | Add a small `worker/package.json` + `tsconfig.json` with `@cloudflare/workers-types` and a `tsc` check in CI. |
| M3 | ⚪ | `layout.tsx` | There's no Open Graph / Twitter metadata, so link previews will be plain. | Add `openGraph` to `metadata`. |
| M4 | ⚪ | Local dev | Next 16 needs Node ≥ 20.9, and this machine has 18.18, so the site can't run locally. | Install Node 22 LTS (or use `nvm-windows` / `fnm`). |

## What's good

- **Secret handling is correct:** the key never reaches the client bundle, `.env`/`.dev.vars` are git-ignored, and secrets reach the Worker only through CI.
- **Input hardening in the Worker:** role allow-list, history capped at 20 messages × 2,000 chars, `max_tokens: 500`, and the last message must come from the user.
- **Grounded persona prompt:** it tells the model to stay on the profile data and not invent facts, and it handles "ignore your instructions" attempts sensibly.
- **Single source of truth:** `data/profile.ts` drives both the page and the chatbot, so they can't drift apart.
- **Semantic, accessible markup:** landmarks, `aria-labelledby` sections, `:focus-visible` styles and an `aria-live` chat log.

## Recommended order

1. **S1** rate limiting (protects your credit and keeps the chat up).
2. **C1** fail the build if `CHAT_API_URL` is missing.
3. **S3, S5** cleanup (remove `upstream`, rotate the old keys).
4. **C2–C4, A1–A2** widget/Worker robustness.
5. Nits as time allows.

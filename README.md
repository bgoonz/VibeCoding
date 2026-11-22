# AI Coder: Vibe Coder to Agentic Engineer — Course Workspace

My working repo for Edward Donner's course **"AI Coder: Complete Claude Code and Coding Agents Course"**.

> Source: the official course resources page (Feb 17, 2026):
> https://edwarddonner.com/2026/02/17/ai-coder-vibe-coder-to-agentic-engineer/
> The notes below are a summary in my own words. Check the original page for the latest updates.

## Projects in this repo

| Folder | What it is |
| --- | --- |
| `codex_kanban/` | Kanban board app (Next.js, Vitest, Playwright) built in Week 1 |
| Pitfire game folder | Game built while vibe coding in an AI IDE |

## Course overview

The course starts with vibe coding in AI IDEs (Cursor, VS Code with Copilot or Codex, Antigravity). It then covers Claude Code, MCP servers and skills, and finally multi-agent workflows and agent teams. The lectures were recorded in February 2026. Tools and models have changed since then, but most of the changes are cosmetic.

### Major links
- Slides and materials: https://drive.google.com/drive/folders/1vvp15mK3ZXDfY8HE4g-tlF2CTfBfSDQ8?usp=sharing
- Curriculum: https://edwarddonner.com/curriculum/
- Directory of Proficient AI Engineers: https://edwarddonner.com/proficient/
- FAQ: https://edwarddonner.com/faq

### Prerequisites
- Git, and Node.js v22 or newer (https://nodejs.org/en/download)
- Docker Desktop (https://docs.docker.com/get-started/get-docker/). On Windows, use the WSL2 backend.
- Accounts for Cursor and GitHub. Optional: Jira, OpenRouter, Massive, sprites.dev.
- Watch your API costs and quotas.

## Week 1 — Vibe coding
- **Day 1:** Build a retro Pong game in [Cursor](https://cursor.com/). As a stretch goal, build a 3D FPS with three.js. To skip Cursor's Agents splash screen, press Ctrl+Shift+N (Cmd+Shift+N on macOS).
- **Day 3:** Set up the tools, then clone the kanban project.
  ```powershell
  winget install --id Git.Git -e --source winget
  git clone https://github.com/ed-donner/kanban.git
  ```
- **Day 4:** Readings on AI and coding skills:
  - [Karpathy on vibe coding](https://x.com/karpathy/status/1886192184808149383)
  - [Simon Willison on vibe engineering](https://simonwillison.net/2025/Oct/7/vibe-engineering/)
  - [Anthropic research on AI assistance and coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills)
  - [Jellyfin's LLM contribution policy](https://jellyfin.org/docs/general/contributing/llm-policies/)
- **Day 5:** Install Docker. Clone the PM project, and optionally check out the `before_yolo` tag.
  ```powershell
  git clone https://github.com/ed-donner/pm.git
  ```

## Week 2 — Claude Code
- **Day 1:** Run Claude Code with free or cheap models through [OpenRouter](https://openrouter.ai/openrouter/free) or [Ollama](https://ollama.com/), for example Kimi K2.5 or GPT-OSS 20B. Also covers [OpenCode](https://opencode.ai/), Pi, and [Amp](https://ampcode.com/). Amp's free tier was paused in March 2026.
- **Day 2:** Slash commands, shortcuts, and Ralph Loops. On Windows you may need `jq`.
- **Day 3:** MCP servers (Context7, Massive) and the [agent-browser](https://github.com/vercel-labs/agent-browser) skill.
  ```powershell
  claude mcp add context7 -- npx -y @upstash/context7-mcp
  ```
  To find more MCP servers and skills, see [skills.sh](https://skills.sh), [glama.ai](https://glama.ai), [mcp.so](https://mcp.so), and [smithery.ai](https://smithery.ai).
- **Days 4–5:** Remote MCP servers for GitHub and Atlassian Jira. Use them with the [prelegal](https://github.com/ed-donner/prelegal.git) repo in a Jira-tickets exercise.

## Week 3 — Agentic engineering
- **Day 1:** [Codex CLI](https://developers.openai.com/codex/cli/) and Claude Code [sub-agents](https://code.claude.com/docs/en/sub-agents). Covers the **FinAlly** project: PLAN.md, sub-agents, hooks, and market data.
  ```powershell
  git clone https://github.com/ed-donner/finally
  ```
- **Day 2:** Five ways to run Claude Code remotely:
  1. The `&` prefix
  2. `claude --remote`
  3. [claude.ai/code](https://claude.ai/code)
  4. The GitHub app (you need to fork the repo first)
  5. A [sprites.dev](https://sprites.dev/) sandbox
- **Day 3:** The [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), [Cowork](https://claude.com/product/cowork), and [OpenClaw](https://openclaw.ai/) for large codebases.
- **Days 4–5:** [Claude Agent Teams](https://code.claude.com/docs/en/agent-teams) and [GSD](https://github.com/open-gsd/gsd-core). FinAlly has a git tag for each version: `start`, `main`, `agent-teams`, `finally-gsd`, and `codex`. Optional extras: [Gas Town](https://github.com/steveyegge/gastown) and teams in [tmux](https://github.com/tmux/tmux/wiki/Installing).

## Community contributions
To share your work, open a PR that adds it to a `community_contributions` folder in the course repos.

<p align="center">
  <img src="https://img.shields.io/npm/v/@peroxide-dev/devlog?color=blue&label=npm" alt="npm version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node version" />
  <img src="https://img.shields.io/npm/l/@anikkaushikkumar/devlog" alt="license" />
  <img src="https://img.shields.io/badge/AI-Claude-blueviolet" alt="Claude AI" />
  <img src="https://img.shields.io/badge/MCP-compatible-orange" alt="MCP compatible" />
</p>

<h1 align="center">devlog</h1>

<p align="center">
  <strong>Turn your git activity into daily logs, standups, and portfolio writeups automatically.</strong>
</p>

<p align="center">
  A local-first CLI that reads your git history and uses Claude AI to generate<br/>
  concise, professional dev summaries. No cloud. No B2B SaaS. No auth. Just your terminal.
</p>

---

## Demo

```
$ devlog today

🧠 Dev Summary — March 20, 2026
────────────────────────────────
• Resolved race condition in job queue by introducing mutex lock
• Refactored auth middleware into composable functions
• Added Redis caching layer, reducing API response time

Saved → ~/.devlog/logs/2026-03-20.json
```

```
$ devlog standup

📋 Standup — March 20, 2026
────────────────────────────
Yesterday:
  • Fixed queue race condition
  • Refactored auth system

Today:
  • Continuing caching layer implementation

Blockers:
  • None
```

---

## Install

```bash
npm install -g @peroxide-dev/devlog
```

## Quick Start

```bash
devlog init          # one-time setup — enter your Anthropic API key
devlog today         # summarize today's git activity
devlog standup       # generate a standup update
```

That's it. Three commands and you're journaling your work.

---

## All Commands

| Command | Description |
|:--------|:------------|
| `devlog init` | One-time setup wizard — configure API key, tone, and log directory |
| `devlog today` | Summarize today's git commits and save as a dev log |
| `devlog yesterday` | Summarize yesterday's git activity |
| `devlog date YYYY-MM-DD` | Summarize git activity for any specific date |
| `devlog standup` | Generate a standup update (yesterday + today + blockers) |
| `devlog export [date]` | Export a saved log as a clean markdown file |
| `devlog logs` | List all saved dev logs |
| `devlog view [date]` | View a saved dev log in your terminal |

---

## Use with Claude Code (MCP)

devlog ships with a built-in [MCP](https://modelcontextprotocol.io) server, so Claude Code can call it directly during your coding sessions.

**Setup (one command):**

```bash
claude mcp add devlog -s user -- devlog-mcp
```

**Then just ask Claude naturally:**

> "Summarize my git activity today"
> "Generate a standup update"
> "What did I work on yesterday?"

**Available MCP tools:**

| Tool | Description |
|:-----|:------------|
| `devlog_init` | Configure API key and settings |
| `devlog_today` | Summarize today's git activity |
| `devlog_yesterday` | Summarize yesterday's activity |
| `devlog_date` | Summarize a specific date |
| `devlog_standup` | Generate standup format |
| `devlog_export` | Export log as markdown |
| `devlog_logs` | List all saved logs |
| `devlog_view` | View a saved log |

---

## How It Works

```
  git log ──► commit messages    ──►  Claude AI  ──►  formatted summary
  git diff ──► files & line stats ──►  (Sonnet)  ──►  saved to ~/.devlog/
```

1. Reads your git history for the target date
2. Extracts commits, changed files, and line stats
3. Sends a structured summary to Claude (Sonnet) with a focused system prompt
4. Prints a clean, bullet-point summary to your terminal
5. Auto-saves as JSON to `~/.devlog/logs/`

---

## Storage

All logs are saved locally as JSON files:

```
~/.devlog/
├── config.json              # your API key and preferences
└── logs/
    ├── 2026-03-18.json      # daily log
    ├── 2026-03-19.json
    ├── 2026-03-19-standup.json
    └── 2026-03-20.json
```

Export any log to markdown with `devlog export 2026-03-20`.

---

## Cost

Typical usage costs less than **$0.10/month** using your own Anthropic API key.
Each summary uses ~500 input tokens and ~200 output tokens.

Get your API key at **[console.anthropic.com](https://console.anthropic.com)**

---

## Privacy

- All logs saved to `~/.devlog/logs/` on **your machine**
- Only git commit messages and file names are sent to the Anthropic API
- No telemetry, no analytics, no tracking, no accounts
- Your code is **never** sent — only metadata

---

## Requirements

- **Node.js** 18+
- **Git**
- **Anthropic API key** — [get one here](https://console.anthropic.com)

---

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

```bash
git clone https://github.com/peroxide-dev/devlog.git
cd devlog
npm install
npm test        # 65 tests
npm run build
```

---

## License

[MIT](LICENSE) — built by [Anik](https://github.com/peroxide-dev)

# devlog — Project Context

## What this is
An open-source local-first CLI tool that transforms git activity into daily logs,
standup summaries, and portfolio writeups using the Claude API.
Everything runs on the developer's machine. No cloud. No SaaS. No auth.

## Current status
Project scaffolded. Ready to build Phase 1.

---

## Stack
- **Runtime**: Node.js 18+ + TypeScript
- **CLI framework**: commander
- **AI**: Claude API via @anthropic-ai/sdk (model: claude-sonnet-4-20250514)
- **Prompts**: @inquirer/prompts (interactive setup wizard)
- **Styling**: chalk (terminal output)
- **Dates**: dayjs
- **Testing**: Vitest
- **Storage**: Local JSON flat-files at ~/.devlog/logs/
- **Config**: ~/.devlog/config.json
- **Publish target**: npm package (npx devlog or global install)

---

## Phases

- [ ] Phase 1 — init wizard + devlog today (BUILD THIS FIRST)
- [ ] Phase 2 — devlog yesterday + devlog date YYYY-MM-DD
- [ ] Phase 3 — devlog standup
- [ ] Phase 4 — devlog export (markdown file)
- [ ] Phase 5 — devlog logs + devlog view [date]
- [ ] Phase 6 — MCP server (wrap CLI as Claude Code tools)

---

## Project Structure

```
devlog/
├── src/
│   ├── index.ts               — CLI entry, commander setup
│   ├── commands/
│   │   ├── init.ts            — first-time setup wizard
│   │   ├── today.ts           — summarize today
│   │   ├── yesterday.ts       — summarize yesterday
│   │   ├── date.ts            — summarize specific date
│   │   ├── standup.ts         — standup format
│   │   ├── export.ts          — export log as markdown
│   │   ├── logs.ts            — list all saved logs
│   │   └── view.ts            — view specific log
│   ├── lib/
│   │   ├── git.ts             — all git shell commands (pure functions)
│   │   ├── claude.ts          — Claude API calls
│   │   ├── storage.ts         — read/write ~/.devlog/
│   │   └── config.ts          — load/save ~/.devlog/config.json
│   └── utils/
│       ├── format.ts          — terminal output formatting
│       └── date.ts            — date parsing helpers
├── tests/
│   ├── git.test.ts
│   ├── claude.test.ts
│   └── storage.test.ts
├── package.json
├── tsconfig.json
├── .env.example               — ANTHROPIC_API_KEY=your-key-here
├── .gitignore                 — node_modules, dist, .env, ~/.devlog
└── README.md
```

---

## Setup Flow (devlog init)

When developer runs `devlog init` for the first time:

1. Print banner:
```
╔═══════════════════════════════╗
║   devlog — dev journal CLI    ║
║   local-first  •  open source ║
╚═══════════════════════════════╝
```

2. Interactive prompts via @inquirer/prompts:
```
? Enter your Anthropic API key: sk-ant-...
? Default summary tone? (daily / standup / portfolio) › daily
? Where to store logs? (~/.devlog/logs) › [enter to confirm]
```

3. Save to ~/.devlog/config.json:
```json
{
  "apiKey": "sk-ant-...",
  "defaultTone": "daily",
  "logsDir": "~/.devlog/logs"
}
```

4. Confirm:
```
✓ Config saved to ~/.devlog/config.json
✓ Run "devlog today" to generate your first log
```

---

## Core Pipeline (today / yesterday / date)

1. Detect git repo in cwd — error gracefully if not a repo
2. git log --since="YYYY-MM-DD 00:00" --until="YYYY-MM-DD 23:59" --pretty=format:"%h %s"
3. git diff --stat HEAD~1 HEAD
4. Build structured input:
```json
{
  "date": "2026-03-20",
  "commits": ["fix: auth bug", "refactor: split middleware"],
  "files_changed": ["auth.ts", "middleware.ts"],
  "insertions": 42,
  "deletions": 11
}
```
5. Send to Claude API (see AI Prompt section)
6. Print to terminal
7. Auto-save to ~/.devlog/logs/YYYY-MM-DD.json

---

## AI Prompt Design

### System prompt:
```
You are a technical writer for developers. Given git activity data, write a
concise professional summary. Rules:
- Bullet points only
- Focus on impact and intent, not implementation details
- No generic filler ("worked on", "made changes to")
- Past tense
- Max 5 bullets for daily, 3 per section for standup
- If no commits found: respond with exactly "No commits found for this date."
```

### User message:
```
Date: {date}
Commits: {commits}
Files changed: {files}
Lines: +{insertions} -{deletions}

Summarize this developer's work.
```

---

## Output Formats

### devlog today
```
🧠 Dev Summary — March 20, 2026
────────────────────────────────
• Resolved race condition in job queue by introducing mutex lock
• Refactored auth middleware into composable functions
• Added Redis caching layer, reducing API response time

Saved → ~/.devlog/logs/2026-03-20.json
```

### devlog standup
```
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

### devlog export
Exports ~/.devlog/logs/2026-03-20.json as ./devlog-export-2026-03-20.md

---

## Local Storage Schema

~/.devlog/logs/YYYY-MM-DD.json:
```json
{
  "date": "2026-03-20",
  "type": "daily",
  "raw": {
    "commits": [],
    "files_changed": [],
    "insertions": 0,
    "deletions": 0
  },
  "summary": "...",
  "generatedAt": "2026-03-20T14:32:00Z"
}
```

---

## package.json Requirements

```json
{
  "name": "devlog",
  "bin": { "devlog": "./dist/index.js" },
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest"
  }
}
```

---

## Rules for Claude

- **Phase order is strict**: complete + verify each phase before starting the next
- **TDD on lib/**: write tests for git.ts, storage.ts, claude.ts before implementing them
- **Pure functions in lib/**: git.ts and storage.ts must be side-effect free and fully testable
- **Cross-platform paths**: always use path.join() — never hardcoded slashes
- **Graceful errors everywhere**: no git repo, missing API key, no commits, API failure — all must give clean error messages not stack traces
- **Config file never committed**: .gitignore must include ~/.devlog and .env
- **No cloud dependencies**: everything runs locally, no external services except Anthropic API
- **Small commits**: one commit per meaningful unit of work
- **Do not start Phase 2 until devlog init + devlog today work end-to-end**

---

## Phase 6 — MCP Server (future, do not build yet)

When starting Phase 6, wrap the CLI as an MCP server so Claude Code can call
devlog tools directly during sessions.

### Additional dependency:
```
npm install @modelcontextprotocol/sdk
```

### New files:
```
src/
└── mcp/
    └── server.ts    — MCP server entry point, registers all tools
```

### Tools to expose:
```
devlog_today        — summarize today's git activity
devlog_standup      — generate standup format
devlog_yesterday    — summarize yesterday
devlog_date         — summarize specific date (input: { date: "YYYY-MM-DD" })
devlog_export       — export log as markdown (input: { date: "YYYY-MM-DD" })
devlog_view         — view a saved log (input: { date: "YYYY-MM-DD" })
devlog_list         — list all saved logs
```

### Each tool follows this pattern:
```ts
server.tool("devlog_today", "Summarize today's git activity", {}, async () => {
  const result = await runToday(); // reuse existing lib/ functions
  return { content: [{ type: "text", text: result }] };
});
```

### package.json addition:
```json
{
  "bin": {
    "devlog": "./dist/index.js",
    "devlog-mcp": "./dist/mcp/server.js"
  }
}
```

### How to add to Claude Code after building:
```powershell
claude mcp add devlog -s user -- node dist/mcp/server.js
```

### Key rule:
All tool handlers must reuse the existing lib/ functions (git.ts, claude.ts,
storage.ts) — do not duplicate logic. The MCP server is just a thin transport
layer on top of the same core.

---

## Definition of Done — V1

- [ ] devlog init works end-to-end on fresh machine
- [ ] devlog today produces clean terminal output
- [ ] devlog standup formats correctly
- [ ] devlog export generates valid markdown
- [ ] All commands handle edge cases gracefully
- [ ] Works on macOS, Linux, Windows (PowerShell)
- [ ] npm run build compiles clean
- [ ] npx devlog works without global install
- [ ] lib/ tests passing with >80% coverage
- [ ] README covers setup in under 5 steps

---

## README Must Include

Quick start:
```
npm install -g devlog
devlog init
devlog today
```

Requirements: Node.js 18+, Git, Anthropic API key (console.anthropic.com)

Privacy note: all logs saved to ~/.devlog/logs/ — nothing leaves your machine
except git summary data sent to Anthropic API.
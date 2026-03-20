# devlog

> Turn your git activity into daily logs, standups, and portfolio writeups — automatically.

A local-first CLI tool that reads your git history and uses Claude AI to generate concise, professional dev summaries. Everything runs on your machine — no cloud, no SaaS, no auth.

## Install

```bash
npm install -g @anikkaushikkumar/devlog
```

## Quick Start

```bash
devlog init       # one-time setup — enter your Anthropic API key
devlog today      # summarize today's git activity
devlog standup    # generate a standup update
```

## All Commands

| Command | Description |
|---------|-------------|
| `devlog init` | One-time setup wizard — configure API key, tone, and log directory |
| `devlog today` | Summarize today's git commits and save as a dev log |
| `devlog yesterday` | Summarize yesterday's git activity |
| `devlog date YYYY-MM-DD` | Summarize git activity for a specific date |
| `devlog standup` | Generate a standup update (yesterday + today + blockers) |
| `devlog export [date]` | Export a saved log as a markdown file |
| `devlog logs` | List all saved dev logs |
| `devlog view [date]` | View a saved dev log |

## Use with Claude Code (MCP)

Register devlog as an MCP tool server so Claude Code can call it directly:

```bash
claude mcp add devlog -s user -- devlog-mcp
```

Then just ask Claude: *"summarize my git activity today"*

Available MCP tools: `devlog_today`, `devlog_yesterday`, `devlog_date`, `devlog_standup`, `devlog_export`, `devlog_logs`, `devlog_view`, `devlog_init`

## Cost

Typical usage costs less than **$0.10/month** using your own Anthropic API key.

Get one at [console.anthropic.com](https://console.anthropic.com)

## Privacy

- All logs saved to `~/.devlog/logs/` on your machine
- Only your git commit messages and file names are sent to the Anthropic API
- No telemetry, no analytics, no tracking

## Requirements

- Node.js 18+
- Git
- Anthropic API key ([get one here](https://console.anthropic.com))

## License

MIT

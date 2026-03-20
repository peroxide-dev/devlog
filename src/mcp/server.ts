#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initFromParams } from "../commands/init.js";
import { runToday } from "../commands/today.js";
import { runYesterday } from "../commands/yesterday.js";
import { runDate } from "../commands/date.js";
import { runStandup } from "../commands/standup.js";
import { runExport } from "../commands/export.js";
import { runLogs } from "../commands/logs.js";
import { runView } from "../commands/view.js";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text: text || "Done." }] };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "devlog",
    version: "1.0.0",
  });

  server.tool(
    "devlog_init",
    "Set up devlog config with an Anthropic API key",
    {
      apiKey: z.string().describe("Anthropic API key (starts with sk-ant-)"),
      defaultTone: z
        .enum(["daily", "standup", "portfolio"])
        .optional()
        .describe("Default summary tone"),
      logsDir: z
        .string()
        .optional()
        .describe("Directory to store logs (default: ~/.devlog/logs)"),
    },
    async ({ apiKey, defaultTone, logsDir }) => {
      const result = await initFromParams({ apiKey, defaultTone, logsDir });
      return textResult(result);
    },
  );

  server.tool(
    "devlog_today",
    "Summarize today's git activity and save as a dev log",
    {},
    async () => {
      const result = await runToday();
      return textResult(result);
    },
  );

  server.tool(
    "devlog_yesterday",
    "Summarize yesterday's git activity and save as a dev log",
    {},
    async () => {
      const result = await runYesterday();
      return textResult(result);
    },
  );

  server.tool(
    "devlog_date",
    "Summarize git activity for a specific date",
    {
      date: z.string().describe("Date in YYYY-MM-DD format"),
    },
    async ({ date }) => {
      const result = await runDate(date);
      return textResult(result);
    },
  );

  server.tool(
    "devlog_standup",
    "Generate a standup update from yesterday and today's git activity",
    {},
    async () => {
      const result = await runStandup();
      return textResult(result);
    },
  );

  server.tool(
    "devlog_export",
    "Export a saved log as a markdown file",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format (default: today)"),
    },
    async ({ date }) => {
      const result = await runExport(date);
      return textResult(result);
    },
  );

  server.tool(
    "devlog_logs",
    "List all saved dev logs",
    {},
    async () => {
      const result = await runLogs();
      return textResult(result);
    },
  );

  server.tool(
    "devlog_view",
    "View a saved dev log for a specific date",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format (default: today)"),
    },
    async ({ date }) => {
      const result = await runView(date);
      return textResult(result);
    },
  );

  return server;
}

// Start server when run directly
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("server.js") ||
    process.argv[1].endsWith("server.ts"));

if (isMainModule) {
  const server = createServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });
}

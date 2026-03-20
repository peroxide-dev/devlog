#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runToday } from "./commands/today.js";
import { runYesterday } from "./commands/yesterday.js";
import { runDate } from "./commands/date.js";
import { runStandup } from "./commands/standup.js";
import { runExport } from "./commands/export.js";

const program = new Command();

program
  .name("devlog")
  .description("Local-first CLI that transforms git activity into dev logs")
  .version("1.0.0");

program
  .command("init")
  .description("Set up devlog with your Anthropic API key")
  .action(async () => {
    try {
      await runInit();
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("User force closed") ||
          err.message.includes("ExitPromptError"))
      ) {
        console.log("\nSetup cancelled.");
        return;
      }
      throw err;
    }
  });

program
  .command("today")
  .description("Summarize today's git activity")
  .action(async () => {
    await runToday();
  });

program
  .command("yesterday")
  .description("Summarize yesterday's git activity")
  .action(async () => {
    await runYesterday();
  });

program
  .command("date <date>")
  .description("Summarize git activity for a specific date (YYYY-MM-DD)")
  .action(async (date: string) => {
    await runDate(date);
  });

program
  .command("standup")
  .description("Generate a standup update from yesterday and today")
  .action(async () => {
    await runStandup();
  });

program
  .command("export [date]")
  .description("Export a saved log as markdown (default: today)")
  .action(async (date?: string) => {
    await runExport(date);
  });

program.parse();

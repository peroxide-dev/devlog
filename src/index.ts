#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runToday } from "./commands/today.js";

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

program.parse();

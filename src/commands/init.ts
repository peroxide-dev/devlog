import { input, select } from "@inquirer/prompts";
import { saveConfig, getDefaultLogsDir } from "../lib/config.js";
import { printBanner, printSuccess } from "../utils/format.js";
import type { DevLogConfig } from "../lib/types.js";

export async function runInit(): Promise<void> {
  printBanner();

  const apiKey = await input({
    message: "Enter your Anthropic API key:",
    validate: (value) => {
      if (!value.trim()) {
        return "API key is required";
      }
      if (!value.startsWith("sk-ant-")) {
        return "API key should start with sk-ant-";
      }
      return true;
    },
  });

  const defaultTone = await select({
    message: "Default summary tone?",
    choices: [
      { name: "daily", value: "daily" as const },
      { name: "standup", value: "standup" as const },
      { name: "portfolio", value: "portfolio" as const },
    ],
  });

  const logsDir = await input({
    message: "Where to store logs?",
    default: getDefaultLogsDir(),
  });

  const config: DevLogConfig = {
    apiKey: apiKey.trim(),
    defaultTone,
    logsDir: logsDir.trim(),
  };

  await saveConfig(config);

  console.log();
  printSuccess("Config saved to ~/.devlog/config.json");
  printSuccess('Run "devlog today" to generate your first log');
}

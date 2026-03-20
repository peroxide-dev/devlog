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

/**
 * Non-interactive init for MCP. Takes API key directly.
 */
export async function initFromParams(params: {
  apiKey: string;
  defaultTone?: "daily" | "standup" | "portfolio";
  logsDir?: string;
}): Promise<string> {
  if (!params.apiKey || !params.apiKey.startsWith("sk-ant-")) {
    return "Error: API key is required and must start with sk-ant-";
  }

  const config: DevLogConfig = {
    apiKey: params.apiKey.trim(),
    defaultTone: params.defaultTone ?? "daily",
    logsDir: params.logsDir?.trim() ?? getDefaultLogsDir(),
  };

  await saveConfig(config);
  return "Config saved to ~/.devlog/config.json. Run devlog_today to generate your first log.";
}

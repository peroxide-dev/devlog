import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import type { DevLogConfig } from "./types.js";

const DEVLOG_DIR = path.join(os.homedir(), ".devlog");
const CONFIG_PATH = path.join(DEVLOG_DIR, "config.json");

export function getDevlogDir(): string {
  return DEVLOG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getDefaultLogsDir(): string {
  return path.join(DEVLOG_DIR, "logs");
}

/**
 * Resolve a logs directory path, expanding ~ to the user's home directory.
 */
export function resolveLogsDir(logsDir: string): string {
  if (logsDir.startsWith("~")) {
    return path.join(os.homedir(), logsDir.slice(1));
  }
  return path.resolve(logsDir);
}

/**
 * Load config from ~/.devlog/config.json. Returns null if not found.
 */
export async function loadConfig(): Promise<DevLogConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(content) as DevLogConfig;
  } catch {
    return null;
  }
}

/**
 * Save config to ~/.devlog/config.json. Creates directory if needed.
 */
export async function saveConfig(config: DevLogConfig): Promise<void> {
  await fs.mkdir(DEVLOG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

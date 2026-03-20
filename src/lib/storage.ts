import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { DevLog } from "./types.js";

/**
 * Save a dev log to the logs directory as YYYY-MM-DD.json.
 * Creates the directory if it does not exist.
 */
export async function saveLog(
  log: DevLog,
  logsDir: string,
  suffix?: string,
): Promise<void> {
  await fs.mkdir(logsDir, { recursive: true });
  const filename = suffix ? `${log.date}-${suffix}.json` : `${log.date}.json`;
  const filePath = path.join(logsDir, filename);
  await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf-8");
}

/**
 * Read a saved log by date. Returns null if no log exists.
 */
export async function readLog(
  date: string,
  logsDir: string,
): Promise<DevLog | null> {
  const filePath = path.join(logsDir, `${date}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as DevLog;
  } catch {
    return null;
  }
}

/**
 * List all saved log dates (sorted, newest first).
 */
export async function listLogs(logsDir: string): Promise<readonly string[]> {
  try {
    const files = await fs.readdir(logsDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Read all saved logs from the logs directory, sorted newest first.
 */
export async function readAllLogs(logsDir: string): Promise<readonly DevLog[]> {
  const stems = await listLogs(logsDir);
  const logs: DevLog[] = [];
  for (const stem of stems) {
    const log = await readLog(stem, logsDir);
    if (log) {
      logs.push(log);
    }
  }
  return logs;
}

/**
 * Read all logs for a specific date (daily + standup variants).
 */
export async function readLogsForDate(
  date: string,
  logsDir: string,
): Promise<readonly DevLog[]> {
  const variants = [date, `${date}-standup`];
  const logs: DevLog[] = [];
  for (const stem of variants) {
    const log = await readLog(stem, logsDir);
    if (log) {
      logs.push(log);
    }
  }
  return logs;
}

import { loadConfig, resolveLogsDir } from "../lib/config.js";
import { readAllLogs } from "../lib/storage.js";
import { printError } from "../utils/format.js";
import type { DevLog } from "../lib/types.js";

const MAX_BULLET_LENGTH = 60;

/**
 * Extract the first bullet point from a summary, truncated.
 */
function extractFirstBullet(summary: string): string {
  const firstLine = summary.split("\n").find((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.endsWith(":");
  });

  if (!firstLine) return "...";

  let bullet = firstLine.trim();
  // Strip leading bullet marker
  if (bullet.startsWith("•")) {
    bullet = bullet.slice(1).trim();
  } else if (bullet.startsWith("-")) {
    bullet = bullet.slice(1).trim();
  }

  if (bullet.length > MAX_BULLET_LENGTH) {
    return bullet.slice(0, MAX_BULLET_LENGTH) + "...";
  }
  return bullet;
}

/**
 * Format a single log entry for the list view.
 */
export function formatLogEntry(log: DevLog): string {
  const typeTag = `[${log.type}]`;
  const bullet = extractFirstBullet(log.summary);
  return `${log.date}  ${typeTag.padEnd(11)} • ${bullet}`;
}

/**
 * List all saved logs. Returns the formatted output string.
 */
export async function runLogs(): Promise<string> {
  const config = await loadConfig();
  if (!config) {
    printError(
      'No config found. Run "devlog init" first to set up your API key.',
    );
    process.exitCode = 1;
    return "";
  }

  const logsDir = resolveLogsDir(config.logsDir);
  const logs = await readAllLogs(logsDir);

  if (logs.length === 0) {
    const msg =
      'No logs found. Run "devlog today" to create your first log.';
    console.log(msg);
    return msg;
  }

  const lines = [
    "📚 Dev Logs",
    "─".repeat(40),
    ...logs.map(formatLogEntry),
    "",
    `Total: ${logs.length} log${logs.length === 1 ? "" : "s"}`,
  ];

  const output = lines.join("\n");
  console.log(output);
  return output;
}

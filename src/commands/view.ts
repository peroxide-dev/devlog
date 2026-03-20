import { loadConfig, resolveLogsDir } from "../lib/config.js";
import { readLogsForDate } from "../lib/storage.js";
import { todayDate, formatDisplayDate, parseDate } from "../utils/date.js";
import { printError } from "../utils/format.js";
import type { DevLog } from "../lib/types.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatViewOutput(log: DevLog): string {
  const displayDate = formatDisplayDate(log.date);
  const typeLabel = log.type === "standup" ? "Standup" : "Dev Log";

  const summaryLines = log.summary
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("•")) return `- ${trimmed.slice(1).trim()}`;
      return trimmed;
    })
    .filter((line) => line.length > 0);

  const lines = [
    `🧠 ${typeLabel} — ${displayDate}`,
    "─".repeat(40),
    ...summaryLines,
    "",
    "Git Stats:",
    `  Files: ${log.raw.filesChanged.join(", ") || "none"}`,
    `  Lines: +${log.raw.insertions} -${log.raw.deletions}`,
  ];

  return lines.join("\n");
}

/**
 * View saved log(s) for a date. Returns the formatted output string.
 */
export async function runView(dateInput?: string): Promise<string> {
  const config = await loadConfig();
  if (!config) {
    printError(
      'No config found. Run "devlog init" first to set up your API key.',
    );
    process.exitCode = 1;
    return "";
  }

  let date: string;
  if (dateInput) {
    if (!DATE_REGEX.test(dateInput)) {
      printError("Invalid date format. Use YYYY-MM-DD");
      process.exitCode = 1;
      return "";
    }
    const parsed = parseDate(dateInput);
    if (!parsed) {
      printError("Invalid date format. Use YYYY-MM-DD");
      process.exitCode = 1;
      return "";
    }
    date = parsed;
  } else {
    date = todayDate();
  }

  const logsDir = resolveLogsDir(config.logsDir);
  const logs = await readLogsForDate(date, logsDir);

  if (logs.length === 0) {
    printError(`No log found for ${date}.`);
    process.exitCode = 1;
    return "";
  }

  const sections = logs.map(formatViewOutput);
  const output = sections.join("\n\n");
  console.log(output);
  return output;
}

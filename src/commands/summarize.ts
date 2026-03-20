import { loadConfig, resolveLogsDir } from "../lib/config.js";
import { getCommitsForDate, getFileStats } from "../lib/git.js";
import { generateSummary } from "../lib/claude.js";
import { saveLog } from "../lib/storage.js";
import { formatDisplayDate } from "../utils/date.js";
import { printSummary, printSuccess, printError } from "../utils/format.js";
import type { GitActivity, DevLog } from "../lib/types.js";

/**
 * Shared pipeline: fetch git data → summarize via Claude → print → save.
 * Used by today, yesterday, and date commands.
 */
export async function summarizeForDate(
  date: string,
  emoji: string,
): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    printError(
      'No config found. Run "devlog init" first to set up your API key.',
    );
    process.exitCode = 1;
    return;
  }

  const cwd = process.cwd();

  let commits: readonly string[];
  try {
    commits = await getCommitsForDate(date, cwd);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not a git repository")) {
      printError("Not a git repository. Run this from inside a git project.");
    } else {
      printError(`Git error: ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  let fileStats: Awaited<ReturnType<typeof getFileStats>>;
  try {
    fileStats = await getFileStats(date, cwd);
  } catch {
    fileStats = { filesChanged: [], insertions: 0, deletions: 0 };
  }

  const activity: GitActivity = {
    date,
    commits: [...commits],
    filesChanged: [...fileStats.filesChanged],
    insertions: fileStats.insertions,
    deletions: fileStats.deletions,
  };

  let summary: string;
  try {
    summary = await generateSummary(config.apiKey, activity);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(`Claude API error: ${message}`);
    process.exitCode = 1;
    return;
  }

  const displayDate = formatDisplayDate(date);
  printSummary(`${emoji} Dev Summary — ${displayDate}`, summary);

  const logsDir = resolveLogsDir(config.logsDir);
  const log: DevLog = {
    date,
    type: config.defaultTone,
    raw: activity,
    summary,
    generatedAt: new Date().toISOString(),
  };

  try {
    await saveLog(log, logsDir);
    printSuccess(`Saved → ${logsDir}/${date}.json`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(`Failed to save log: ${message}`);
  }
}

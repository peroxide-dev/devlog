import { loadConfig, resolveLogsDir } from "../lib/config.js";
import { getCommitsForDate, getFileStats } from "../lib/git.js";
import { generateStandupSummary } from "../lib/claude.js";
import { saveLog } from "../lib/storage.js";
import { todayDate, yesterdayDate, formatDisplayDate } from "../utils/date.js";
import { printSummary, printSuccess, printError } from "../utils/format.js";
import type { GitActivity, DevLog } from "../lib/types.js";

async function fetchActivity(date: string, cwd: string): Promise<GitActivity> {
  let commits: readonly string[];
  try {
    commits = await getCommitsForDate(date, cwd);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not a git repository")) {
      throw new Error("Not a git repository. Run this from inside a git project.");
    }
    throw err;
  }

  let fileStats: Awaited<ReturnType<typeof getFileStats>>;
  try {
    fileStats = await getFileStats(date, cwd);
  } catch {
    fileStats = { filesChanged: [], insertions: 0, deletions: 0 };
  }

  return {
    date,
    commits: [...commits],
    filesChanged: [...fileStats.filesChanged],
    insertions: fileStats.insertions,
    deletions: fileStats.deletions,
  };
}

export async function runStandup(): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    printError(
      'No config found. Run "devlog init" first to set up your API key.',
    );
    process.exitCode = 1;
    return;
  }

  const cwd = process.cwd();
  const today = todayDate();
  const yesterday = yesterdayDate();

  let yesterdayActivity: GitActivity;
  let todayActivity: GitActivity;
  try {
    yesterdayActivity = await fetchActivity(yesterday, cwd);
    todayActivity = await fetchActivity(today, cwd);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(message);
    process.exitCode = 1;
    return;
  }

  let summary: string;
  try {
    summary = await generateStandupSummary(
      config.apiKey,
      yesterdayActivity,
      todayActivity,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(`Claude API error: ${message}`);
    process.exitCode = 1;
    return;
  }

  const displayDate = formatDisplayDate(today);
  printSummary(`📋 Standup — ${displayDate}`, summary);

  const logsDir = resolveLogsDir(config.logsDir);
  const log: DevLog = {
    date: today,
    type: "standup",
    raw: todayActivity,
    summary,
    generatedAt: new Date().toISOString(),
  };

  try {
    await saveLog(log, logsDir, "standup");
    printSuccess(`Saved → ${logsDir}/${today}-standup.json`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(`Failed to save log: ${message}`);
  }
}

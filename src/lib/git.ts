import { execFile as execFileCb } from "node:child_process";

function execGit(
  args: readonly string[],
  cwd: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFileCb("git", [...args], { cwd }, (err, stdout, stderr) => {
      if (err) {
        const message = stderr || err.message;
        reject(new Error(message));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Returns commit messages (without hash prefix) for a given date.
 */
export async function getCommitsForDate(
  date: string,
  cwd: string,
): Promise<readonly string[]> {
  const stdout = await execGit(
    [
      "log",
      `--since=${date} 00:00`,
      `--until=${date} 23:59`,
      "--pretty=format:%h %s",
    ],
    cwd,
  );

  if (!stdout.trim()) {
    return [];
  }

  return stdout
    .trim()
    .split("\n")
    .map((line) => line.replace(/^[a-f0-9]+ /, ""));
}

export interface FileStats {
  readonly filesChanged: readonly string[];
  readonly insertions: number;
  readonly deletions: number;
}

/**
 * Returns file change stats for a given date using git diff --stat.
 */
export async function getFileStats(
  date: string,
  cwd: string,
): Promise<FileStats> {
  const stdout = await execGit(
    [
      "log",
      `--since=${date} 00:00`,
      `--until=${date} 23:59`,
      "--diff-filter=ACDMRT",
      "--stat",
      "--pretty=format:",
    ],
    cwd,
  );

  if (!stdout.trim()) {
    return { filesChanged: [], insertions: 0, deletions: 0 };
  }

  return parseDiffStat(stdout);
}

function parseDiffStat(output: string): FileStats {
  const lines = output.trimEnd().split("\n");
  const files: string[] = [];
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    // Summary line: " 2 files changed, 32 insertions(+), 11 deletions(-)"
    const summaryMatch = line.match(
      /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/,
    );
    if (summaryMatch) {
      insertions += Number(summaryMatch[2] ?? 0);
      deletions += Number(summaryMatch[3] ?? 0);
      continue;
    }

    // File line: " src/auth.ts      | 20 ++++++++++---------"
    const fileMatch = line.match(/^\s+(.+?)\s+\|/);
    if (fileMatch) {
      files.push(fileMatch[1]!.trim());
    }
  }

  return { filesChanged: files, insertions, deletions };
}

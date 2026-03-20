import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCommitsForDate, getFileStats } from "../src/lib/git.js";

// Mock child_process.execFile so tests don't need a real git repo
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";

const mockExecFile = vi.mocked(execFile);

function setupExecFile(stdout: string, stderr = "") {
  mockExecFile.mockImplementation(
    (_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
      const callback = cb as (
        err: Error | null,
        stdout: string,
        stderr: string,
      ) => void;
      callback(null, stdout, stderr);
      return {} as ReturnType<typeof execFile>;
    },
  );
}

function setupExecFileError(message: string) {
  mockExecFile.mockImplementation(
    (_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
      const callback = cb as (
        err: Error | null,
        stdout: string,
        stderr: string,
      ) => void;
      callback(new Error(message), "", "");
      return {} as ReturnType<typeof execFile>;
    },
  );
}

describe("getCommitsForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return commits for a given date", async () => {
    setupExecFile("abc1234 fix: auth bug\ndef5678 refactor: split middleware\n");

    const commits = await getCommitsForDate("2026-03-20", "/fake/repo");
    expect(commits).toEqual([
      "fix: auth bug",
      "refactor: split middleware",
    ]);
  });

  it("should return empty array when no commits found", async () => {
    setupExecFile("");

    const commits = await getCommitsForDate("2026-03-20", "/fake/repo");
    expect(commits).toEqual([]);
  });

  it("should throw a clean error when not in a git repo", async () => {
    setupExecFileError("fatal: not a git repository");

    await expect(
      getCommitsForDate("2026-03-20", "/not-a-repo"),
    ).rejects.toThrow(/not a git repository/i);
  });
});

describe("getFileStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse file stats from git diff --stat output", async () => {
    const diffOutput = [
      " src/auth.ts      | 20 ++++++++++---------",
      " src/middleware.ts | 33 +++++++++++++++++++++++++------",
      " 2 files changed, 32 insertions(+), 11 deletions(-)",
    ].join("\n");

    setupExecFile(diffOutput);

    const stats = await getFileStats("2026-03-20", "/fake/repo");
    expect(stats.filesChanged).toEqual(["src/auth.ts", "src/middleware.ts"]);
    expect(stats.insertions).toBe(32);
    expect(stats.deletions).toBe(11);
  });

  it("should return zeros when no changes found", async () => {
    setupExecFile("");

    const stats = await getFileStats("2026-03-20", "/fake/repo");
    expect(stats.filesChanged).toEqual([]);
    expect(stats.insertions).toBe(0);
    expect(stats.deletions).toBe(0);
  });
});

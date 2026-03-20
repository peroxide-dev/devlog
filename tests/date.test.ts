import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing the modules under test
vi.mock("../src/lib/config.js", () => ({
  loadConfig: vi.fn(),
  resolveLogsDir: vi.fn((dir: string) => dir),
}));

vi.mock("../src/lib/git.js", () => ({
  getCommitsForDate: vi.fn(),
  getFileStats: vi.fn(),
}));

vi.mock("../src/lib/claude.js", () => ({
  generateSummary: vi.fn(),
}));

vi.mock("../src/lib/storage.js", () => ({
  saveLog: vi.fn(),
}));

import { loadConfig } from "../src/lib/config.js";
import { getCommitsForDate, getFileStats } from "../src/lib/git.js";
import { generateSummary } from "../src/lib/claude.js";
import { saveLog } from "../src/lib/storage.js";
import { runDate } from "../src/commands/date.js";

const mockLoadConfig = vi.mocked(loadConfig);
const mockGetCommits = vi.mocked(getCommitsForDate);
const mockGetFileStats = vi.mocked(getFileStats);
const mockGenerateSummary = vi.mocked(generateSummary);
const mockSaveLog = vi.mocked(saveLog);

function setupHappyPath() {
  mockLoadConfig.mockResolvedValue({
    apiKey: "sk-ant-test",
    defaultTone: "daily",
    logsDir: "/tmp/devlog-test/logs",
  });
  mockGetCommits.mockResolvedValue(["feat: add caching"]);
  mockGetFileStats.mockResolvedValue({
    filesChanged: ["cache.ts"],
    insertions: 25,
    deletions: 0,
  });
  mockGenerateSummary.mockResolvedValue("• Added caching layer");
  mockSaveLog.mockResolvedValue(undefined);
}

describe("runDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("should fetch commits for the specified date", async () => {
    setupHappyPath();

    await runDate("2026-03-19");

    expect(mockGetCommits).toHaveBeenCalledWith(
      "2026-03-19",
      expect.any(String),
    );
  });

  it("should save the log with the specified date", async () => {
    setupHappyPath();

    await runDate("2026-03-19");

    expect(mockSaveLog).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-03-19" }),
      expect.any(String),
    );
  });

  it("should reject invalid date format with a clean error", async () => {
    setupHappyPath();

    await runDate("not-a-date");

    expect(process.exitCode).toBe(1);
    expect(mockGetCommits).not.toHaveBeenCalled();
  });

  it("should reject partial date formats", async () => {
    setupHappyPath();

    await runDate("2026-03");

    expect(process.exitCode).toBe(1);
    expect(mockGetCommits).not.toHaveBeenCalled();
  });

  it("should handle date with no commits gracefully", async () => {
    setupHappyPath();
    mockGetCommits.mockResolvedValue([]);
    mockGenerateSummary.mockResolvedValue("No commits found for this date.");

    await runDate("2026-01-01");

    expect(process.exitCode).toBeUndefined();
  });

  it("should error gracefully when no config exists", async () => {
    mockLoadConfig.mockResolvedValue(null);

    await runDate("2026-03-19");

    expect(process.exitCode).toBe(1);
    expect(mockGetCommits).not.toHaveBeenCalled();
  });
});

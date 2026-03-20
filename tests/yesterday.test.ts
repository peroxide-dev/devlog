import { describe, it, expect, vi, beforeEach } from "vitest";
import dayjs from "dayjs";

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
import { runYesterday } from "../src/commands/yesterday.js";

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
  mockGetCommits.mockResolvedValue(["fix: auth bug"]);
  mockGetFileStats.mockResolvedValue({
    filesChanged: ["auth.ts"],
    insertions: 10,
    deletions: 3,
  });
  mockGenerateSummary.mockResolvedValue("• Fixed auth bug");
  mockSaveLog.mockResolvedValue(undefined);
}

describe("runYesterday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("should fetch commits for yesterday's date", async () => {
    setupHappyPath();
    const expectedDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    await runYesterday();

    expect(mockGetCommits).toHaveBeenCalledWith(expectedDate, expect.any(String));
  });

  it("should error gracefully when no config exists", async () => {
    mockLoadConfig.mockResolvedValue(null);

    await runYesterday();

    expect(process.exitCode).toBe(1);
    expect(mockGetCommits).not.toHaveBeenCalled();
  });

  it("should handle zero commits without crashing", async () => {
    setupHappyPath();
    mockGetCommits.mockResolvedValue([]);
    mockGenerateSummary.mockResolvedValue("No commits found for this date.");

    await runYesterday();

    expect(process.exitCode).toBeUndefined();
  });

  it("should save the log with yesterday's date", async () => {
    setupHappyPath();
    const expectedDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    await runYesterday();

    expect(mockSaveLog).toHaveBeenCalledWith(
      expect.objectContaining({ date: expectedDate }),
      expect.any(String),
    );
  });
});

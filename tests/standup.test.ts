import { describe, it, expect, vi, beforeEach } from "vitest";
import dayjs from "dayjs";

// Mock all dependencies before importing the module under test
vi.mock("../src/lib/config.js", () => ({
  loadConfig: vi.fn(),
  resolveLogsDir: vi.fn((dir: string) => dir),
}));

vi.mock("../src/lib/git.js", () => ({
  getCommitsForDate: vi.fn(),
  getFileStats: vi.fn(),
}));

vi.mock("../src/lib/claude.js", () => ({
  generateStandupSummary: vi.fn(),
}));

vi.mock("../src/lib/storage.js", () => ({
  saveLog: vi.fn(),
}));

import { loadConfig } from "../src/lib/config.js";
import { getCommitsForDate, getFileStats } from "../src/lib/git.js";
import { generateStandupSummary } from "../src/lib/claude.js";
import { saveLog } from "../src/lib/storage.js";
import { runStandup } from "../src/commands/standup.js";

const mockLoadConfig = vi.mocked(loadConfig);
const mockGetCommits = vi.mocked(getCommitsForDate);
const mockGetFileStats = vi.mocked(getFileStats);
const mockGenerateStandup = vi.mocked(generateStandupSummary);
const mockSaveLog = vi.mocked(saveLog);

const YESTERDAY = dayjs().subtract(1, "day").format("YYYY-MM-DD");
const TODAY = dayjs().format("YYYY-MM-DD");

const STANDUP_OUTPUT = [
  "Yesterday:",
  "  • Fixed auth bug",
  "",
  "Today:",
  "  • No commits yet today",
  "",
  "Blockers:",
  "  • None",
].join("\n");

function setupHappyPath() {
  mockLoadConfig.mockResolvedValue({
    apiKey: "sk-ant-test",
    defaultTone: "daily",
    logsDir: "/tmp/devlog-test/logs",
  });

  mockGetCommits.mockImplementation(async (date: string) => {
    if (date === YESTERDAY) return ["fix: auth bug"];
    if (date === TODAY) return [];
    return [];
  });

  mockGetFileStats.mockResolvedValue({
    filesChanged: ["auth.ts"],
    insertions: 10,
    deletions: 3,
  });

  mockGenerateStandup.mockResolvedValue(STANDUP_OUTPUT);
  mockSaveLog.mockResolvedValue(undefined);
}

describe("runStandup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("should fetch yesterday's commits correctly", async () => {
    setupHappyPath();

    await runStandup();

    expect(mockGetCommits).toHaveBeenCalledWith(YESTERDAY, expect.any(String));
  });

  it("should fetch today's commits correctly", async () => {
    setupHappyPath();

    await runStandup();

    expect(mockGetCommits).toHaveBeenCalledWith(TODAY, expect.any(String));
  });

  it("should call generateStandupSummary with both days' activity", async () => {
    setupHappyPath();

    await runStandup();

    expect(mockGenerateStandup).toHaveBeenCalledWith(
      "sk-ant-test",
      expect.objectContaining({ date: YESTERDAY }),
      expect.objectContaining({ date: TODAY }),
    );
  });

  it("should handle no commits yesterday gracefully", async () => {
    setupHappyPath();
    mockGetCommits.mockResolvedValue([]);
    mockGenerateStandup.mockResolvedValue(
      "Yesterday:\n  • No activity recorded\n\nToday:\n  • No commits yet today\n\nBlockers:\n  • None",
    );

    await runStandup();

    expect(process.exitCode).toBeUndefined();
  });

  it("should handle no commits today gracefully", async () => {
    setupHappyPath();
    // yesterday has commits, today doesn't — already the default happy path
    await runStandup();

    expect(process.exitCode).toBeUndefined();
  });

  it("should handle no commits either day", async () => {
    setupHappyPath();
    mockGetCommits.mockResolvedValue([]);
    mockGenerateStandup.mockResolvedValue(
      "Yesterday:\n  • No activity recorded\n\nToday:\n  • No activity recorded\n\nBlockers:\n  • None",
    );

    await runStandup();

    expect(process.exitCode).toBeUndefined();
    expect(mockGenerateStandup).toHaveBeenCalled();
  });

  it("should save the log with standup suffix", async () => {
    setupHappyPath();

    await runStandup();

    expect(mockSaveLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: "standup" }),
      expect.any(String),
      "standup",
    );
  });

  it("should error gracefully when no config exists", async () => {
    mockLoadConfig.mockResolvedValue(null);

    await runStandup();

    expect(process.exitCode).toBe(1);
    expect(mockGetCommits).not.toHaveBeenCalled();
  });
});

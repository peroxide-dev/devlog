import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("../src/lib/config.js", () => ({
  loadConfig: vi.fn(),
  resolveLogsDir: vi.fn((dir: string) => dir),
}));

import { loadConfig } from "../src/lib/config.js";
import { saveLog } from "../src/lib/storage.js";
import { runLogs, formatLogEntry } from "../src/commands/logs.js";
import type { DevLog } from "../src/lib/types.js";

const mockLoadConfig = vi.mocked(loadConfig);

function makelog(date: string, type: DevLog["type"], summary: string): DevLog {
  return {
    date,
    type,
    raw: {
      date,
      commits: ["test commit"],
      filesChanged: ["file.ts"],
      insertions: 10,
      deletions: 2,
    },
    summary,
    generatedAt: `${date}T12:00:00Z`,
  };
}

describe("formatLogEntry", () => {
  it("should format a daily log entry with first bullet", () => {
    const log = makelog("2026-03-20", "daily", "• Fixed auth bug\n• Refactored");
    const entry = formatLogEntry(log);

    expect(entry).toContain("2026-03-20");
    expect(entry).toContain("daily");
    expect(entry).toContain("Fixed auth bug");
  });

  it("should format a standup log entry", () => {
    const log = makelog("2026-03-20", "standup", "Yesterday:\n  • Did stuff");
    const entry = formatLogEntry(log);

    expect(entry).toContain("standup");
  });

  it("should truncate long first bullet", () => {
    const longBullet = "• " + "A".repeat(100);
    const log = makelog("2026-03-20", "daily", longBullet);
    const entry = formatLogEntry(log);

    expect(entry.length).toBeLessThan(150);
  });
});

describe("runLogs", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "devlog-logs-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function setupConfig() {
    mockLoadConfig.mockResolvedValue({
      apiKey: "sk-ant-test",
      defaultTone: "daily",
      logsDir: tempDir,
    });
  }

  it("should list all saved logs sorted by date descending", async () => {
    setupConfig();
    await saveLog(makelog("2026-03-18", "daily", "• Day 1"), tempDir);
    await saveLog(makelog("2026-03-20", "daily", "• Day 3"), tempDir);
    await saveLog(makelog("2026-03-19", "daily", "• Day 2"), tempDir);

    const output = await runLogs();

    // First entry should be the most recent
    const idx20 = output.indexOf("2026-03-20");
    const idx19 = output.indexOf("2026-03-19");
    const idx18 = output.indexOf("2026-03-18");
    expect(idx20).toBeLessThan(idx19);
    expect(idx19).toBeLessThan(idx18);
  });

  it("should show date, type, and first bullet of summary", async () => {
    setupConfig();
    await saveLog(makelog("2026-03-20", "daily", "• Fixed auth bug\n• Second"), tempDir);

    const output = await runLogs();

    expect(output).toContain("2026-03-20");
    expect(output).toContain("daily");
    expect(output).toContain("Fixed auth bug");
  });

  it("should handle empty logs directory", async () => {
    setupConfig();

    const output = await runLogs();

    expect(output).toContain("No logs found");
  });

  it("should handle logs directory not existing", async () => {
    mockLoadConfig.mockResolvedValue({
      apiKey: "sk-ant-test",
      defaultTone: "daily",
      logsDir: path.join(tempDir, "does-not-exist"),
    });

    const output = await runLogs();

    expect(output).toContain("No logs found");
  });

  it("should error when no config exists", async () => {
    mockLoadConfig.mockResolvedValue(null);

    await runLogs();

    expect(process.exitCode).toBe(1);
  });

  it("should show total count", async () => {
    setupConfig();
    await saveLog(makelog("2026-03-20", "daily", "• Day 1"), tempDir);
    await saveLog(makelog("2026-03-19", "daily", "• Day 2"), tempDir);

    const output = await runLogs();

    expect(output).toContain("2 logs");
  });
});

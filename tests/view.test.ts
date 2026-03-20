import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import dayjs from "dayjs";

vi.mock("../src/lib/config.js", () => ({
  loadConfig: vi.fn(),
  resolveLogsDir: vi.fn((dir: string) => dir),
}));

import { loadConfig } from "../src/lib/config.js";
import { saveLog } from "../src/lib/storage.js";
import { runView } from "../src/commands/view.js";
import type { DevLog } from "../src/lib/types.js";

const mockLoadConfig = vi.mocked(loadConfig);

function makelog(date: string, type: DevLog["type"], summary: string): DevLog {
  return {
    date,
    type,
    raw: {
      date,
      commits: ["fix: auth bug"],
      filesChanged: ["auth.ts", "middleware.ts"],
      insertions: 42,
      deletions: 11,
    },
    summary,
    generatedAt: `${date}T14:32:00Z`,
  };
}

describe("runView", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "devlog-view-test-"));
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

  it("should display full saved log for a given date", async () => {
    setupConfig();
    const log = makelog("2026-03-20", "daily", "• Fixed auth bug\n• Refactored middleware");
    await saveLog(log, tempDir);

    const output = await runView("2026-03-20");

    expect(output).toContain("Fixed auth bug");
    expect(output).toContain("Refactored middleware");
    expect(output).toContain("auth.ts");
    expect(output).toContain("+42");
    expect(output).toContain("-11");
  });

  it("should default to today if no date argument given", async () => {
    setupConfig();
    const today = dayjs().format("YYYY-MM-DD");
    const log = makelog(today, "daily", "• Today's work");
    await saveLog(log, tempDir);

    const output = await runView();

    expect(output).toContain("Today's work");
  });

  it("should error cleanly if no log found for that date", async () => {
    setupConfig();

    await runView("2099-01-01");

    expect(process.exitCode).toBe(1);
  });

  it("should show both daily and standup logs if both exist", async () => {
    setupConfig();
    const daily = makelog("2026-03-20", "daily", "• Daily summary");
    const standup = makelog("2026-03-20", "standup", "Yesterday:\n  • Standup content");
    await saveLog(daily, tempDir);
    await saveLog(standup, tempDir, "standup");

    const output = await runView("2026-03-20");

    expect(output).toContain("Daily summary");
    expect(output).toContain("Standup content");
  });

  it("should error when no config exists", async () => {
    mockLoadConfig.mockResolvedValue(null);

    await runView("2026-03-20");

    expect(process.exitCode).toBe(1);
  });

  it("should reject invalid date format", async () => {
    setupConfig();

    await runView("not-a-date");

    expect(process.exitCode).toBe(1);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { saveLog, readLog, listLogs } from "../src/lib/storage.js";
import type { DevLog } from "../src/lib/types.js";

const TEST_LOG: DevLog = {
  date: "2026-03-20",
  type: "daily",
  raw: {
    date: "2026-03-20",
    commits: ["fix: auth bug", "refactor: split middleware"],
    filesChanged: ["auth.ts", "middleware.ts"],
    insertions: 42,
    deletions: 11,
  },
  summary:
    "• Resolved auth bug\n• Refactored middleware into composable functions",
  generatedAt: "2026-03-20T14:32:00Z",
};

describe("storage", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "devlog-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("saveLog", () => {
    it("should save a log file as JSON", async () => {
      await saveLog(TEST_LOG, tempDir);

      const filePath = path.join(tempDir, "2026-03-20.json");
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content) as DevLog;

      expect(parsed.date).toBe("2026-03-20");
      expect(parsed.type).toBe("daily");
      expect(parsed.summary).toContain("auth bug");
    });

    it("should create the logs directory if it does not exist", async () => {
      const nestedDir = path.join(tempDir, "nested", "logs");
      await saveLog(TEST_LOG, nestedDir);

      const filePath = path.join(nestedDir, "2026-03-20.json");
      const content = await fs.readFile(filePath, "utf-8");
      expect(JSON.parse(content)).toEqual(TEST_LOG);
    });
  });

  describe("readLog", () => {
    it("should read a saved log by date", async () => {
      await saveLog(TEST_LOG, tempDir);
      const log = await readLog("2026-03-20", tempDir);

      expect(log).toEqual(TEST_LOG);
    });

    it("should return null if no log exists for the date", async () => {
      const log = await readLog("2099-01-01", tempDir);
      expect(log).toBeNull();
    });
  });

  describe("listLogs", () => {
    it("should list all saved log dates", async () => {
      await saveLog(TEST_LOG, tempDir);
      await saveLog({ ...TEST_LOG, date: "2026-03-19" }, tempDir);

      const dates = await listLogs(tempDir);
      expect(dates).toContain("2026-03-20");
      expect(dates).toContain("2026-03-19");
      expect(dates).toHaveLength(2);
    });

    it("should return empty array if no logs exist", async () => {
      const dates = await listLogs(tempDir);
      expect(dates).toEqual([]);
    });
  });
});

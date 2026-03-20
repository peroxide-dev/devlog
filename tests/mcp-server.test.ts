import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all command modules
vi.mock("../src/commands/init.js", () => ({
  initFromParams: vi.fn(),
}));
vi.mock("../src/commands/today.js", () => ({
  runToday: vi.fn(),
}));
vi.mock("../src/commands/yesterday.js", () => ({
  runYesterday: vi.fn(),
}));
vi.mock("../src/commands/date.js", () => ({
  runDate: vi.fn(),
}));
vi.mock("../src/commands/standup.js", () => ({
  runStandup: vi.fn(),
}));
vi.mock("../src/commands/export.js", () => ({
  runExport: vi.fn(),
}));
vi.mock("../src/commands/logs.js", () => ({
  runLogs: vi.fn(),
}));
vi.mock("../src/commands/view.js", () => ({
  runView: vi.fn(),
}));

import { initFromParams } from "../src/commands/init.js";
import { runToday } from "../src/commands/today.js";
import { runYesterday } from "../src/commands/yesterday.js";
import { runDate } from "../src/commands/date.js";
import { runStandup } from "../src/commands/standup.js";
import { runExport } from "../src/commands/export.js";
import { runLogs } from "../src/commands/logs.js";
import { runView } from "../src/commands/view.js";
import { createServer } from "../src/mcp/server.js";

const mockInitFromParams = vi.mocked(initFromParams);
const mockRunToday = vi.mocked(runToday);
const mockRunYesterday = vi.mocked(runYesterday);
const mockRunDate = vi.mocked(runDate);
const mockRunStandup = vi.mocked(runStandup);
const mockRunExport = vi.mocked(runExport);
const mockRunLogs = vi.mocked(runLogs);
const mockRunView = vi.mocked(runView);

// Helper to access internal tools (plain object, not Map)
interface RegisteredTool {
  handler: (...args: unknown[]) => Promise<unknown>;
}

function getTools(server: ReturnType<typeof createServer>) {
  return (server as unknown as { _registeredTools: Record<string, RegisteredTool> })._registeredTools;
}

describe("MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a server without errors", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("should register all 8 tools with correct names", () => {
    const server = createServer();
    const tools = getTools(server);
    const toolNames = Object.keys(tools);

    expect(toolNames).toContain("devlog_init");
    expect(toolNames).toContain("devlog_today");
    expect(toolNames).toContain("devlog_yesterday");
    expect(toolNames).toContain("devlog_date");
    expect(toolNames).toContain("devlog_standup");
    expect(toolNames).toContain("devlog_export");
    expect(toolNames).toContain("devlog_logs");
    expect(toolNames).toContain("devlog_view");
    expect(toolNames).toHaveLength(8);
  });

  it("should register exactly 8 tools (no extra tools)", () => {
    const server = createServer();
    const tools = getTools(server);
    expect(Object.keys(tools)).toHaveLength(8);
  });
});

describe("MCP Tool Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devlog_today should call runToday and return MCP format", async () => {
    mockRunToday.mockResolvedValue("• Fixed auth bug");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_today"]!.handler({}) as { content: Array<{ type: string; text: string }> };

    expect(mockRunToday).toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0]!.type).toBe("text");
    expect(result.content[0]!.text).toContain("Fixed auth bug");
  });

  it("devlog_yesterday should call runYesterday", async () => {
    mockRunYesterday.mockResolvedValue("• Yesterday's work");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_yesterday"]!.handler({}) as { content: Array<{ type: string; text: string }> };

    expect(mockRunYesterday).toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("Yesterday's work");
  });

  it("devlog_date should call runDate with date arg", async () => {
    mockRunDate.mockResolvedValue("• Work on March 19");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_date"]!.handler({ date: "2026-03-19" }) as { content: Array<{ type: string; text: string }> };

    expect(mockRunDate).toHaveBeenCalledWith("2026-03-19");
    expect(result.content[0]!.text).toContain("Work on March 19");
  });

  it("devlog_standup should call runStandup", async () => {
    mockRunStandup.mockResolvedValue("Yesterday:\n  • Did stuff");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_standup"]!.handler({}) as { content: Array<{ type: string; text: string }> };

    expect(mockRunStandup).toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("Did stuff");
  });

  it("devlog_export should call runExport with optional date", async () => {
    mockRunExport.mockResolvedValue("Exported → /path/to/file.md");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_export"]!.handler({ date: "2026-03-20" }) as { content: Array<{ type: string; text: string }> };

    expect(mockRunExport).toHaveBeenCalledWith("2026-03-20");
    expect(result.content[0]!.text).toContain("Exported");
  });

  it("devlog_logs should call runLogs", async () => {
    mockRunLogs.mockResolvedValue("📚 Dev Logs\n2026-03-20 [daily]");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_logs"]!.handler({}) as { content: Array<{ type: string; text: string }> };

    expect(mockRunLogs).toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("Dev Logs");
  });

  it("devlog_view should call runView with optional date", async () => {
    mockRunView.mockResolvedValue("🧠 Dev Log — March 20");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_view"]!.handler({ date: "2026-03-20" }) as { content: Array<{ type: string; text: string }> };

    expect(mockRunView).toHaveBeenCalledWith("2026-03-20");
    expect(result.content[0]!.text).toContain("Dev Log");
  });

  it("devlog_init should call initFromParams with apiKey", async () => {
    mockInitFromParams.mockResolvedValue("Config saved");
    const server = createServer();
    const tools = getTools(server);
    const result = await tools["devlog_init"]!.handler({ apiKey: "sk-ant-test123" }) as { content: Array<{ type: string; text: string }> };

    expect(mockInitFromParams).toHaveBeenCalledWith({
      apiKey: "sk-ant-test123",
      defaultTone: undefined,
      logsDir: undefined,
    });
    expect(result.content[0]!.text).toContain("Config saved");
  });
});

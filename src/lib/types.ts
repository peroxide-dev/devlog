export interface GitActivity {
  readonly date: string;
  readonly commits: readonly string[];
  readonly filesChanged: readonly string[];
  readonly insertions: number;
  readonly deletions: number;
}

export interface DevLog {
  readonly date: string;
  readonly type: "daily" | "standup" | "portfolio";
  readonly raw: GitActivity;
  readonly summary: string;
  readonly generatedAt: string;
}

export interface DevLogConfig {
  readonly apiKey: string;
  readonly defaultTone: "daily" | "standup" | "portfolio";
  readonly logsDir: string;
}

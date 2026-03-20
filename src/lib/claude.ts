import Anthropic from "@anthropic-ai/sdk";
import type { GitActivity } from "./types.js";

const SYSTEM_PROMPT = `You are a technical writer for developers. Given git activity data, write a
concise professional summary. Rules:
- Bullet points only
- Focus on impact and intent, not implementation details
- No generic filler ("worked on", "made changes to")
- Past tense
- Max 5 bullets for daily, 3 per section for standup
- If no commits found: respond with exactly "No commits found for this date."`;

function buildUserMessage(activity: GitActivity): string {
  return [
    `Date: ${activity.date}`,
    `Commits: ${activity.commits.join(", ")}`,
    `Files changed: ${activity.filesChanged.join(", ")}`,
    `Lines: +${activity.insertions} -${activity.deletions}`,
    "",
    "Summarize this developer's work.",
  ].join("\n");
}

/**
 * Generate a dev log summary from git activity using the Claude API.
 */
export async function generateSummary(
  apiKey: string,
  activity: GitActivity,
): Promise<string> {
  if (activity.commits.length === 0) {
    return "No commits found for this date.";
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(activity),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content");
  }

  return textBlock.text;
}

const STANDUP_SYSTEM_PROMPT = `You are a technical writer for developers writing a standup update.
Given git activity for yesterday and today, output ONLY this exact format:

Yesterday:
  • [bullet]

Today:
  • [bullet] (or "No commits yet today" if empty)

Blockers:
  • None (unless commit messages suggest a blocker e.g. "blocked", "waiting", "stuck")

Rules:
- Max 3 bullets per section
- Past tense for yesterday, present/future tense for today
- No generic filler phrases
- If no commits for a day: write "No activity recorded"`;

function buildStandupMessage(
  yesterday: GitActivity,
  today: GitActivity,
): string {
  return [
    "Yesterday's activity:",
    `  Date: ${yesterday.date}`,
    `  Commits: ${yesterday.commits.length > 0 ? yesterday.commits.join(", ") : "none"}`,
    `  Files changed: ${yesterday.filesChanged.join(", ") || "none"}`,
    `  Lines: +${yesterday.insertions} -${yesterday.deletions}`,
    "",
    "Today's activity:",
    `  Date: ${today.date}`,
    `  Commits: ${today.commits.length > 0 ? today.commits.join(", ") : "none"}`,
    `  Files changed: ${today.filesChanged.join(", ") || "none"}`,
    `  Lines: +${today.insertions} -${today.deletions}`,
    "",
    "Write the standup update.",
  ].join("\n");
}

/**
 * Generate a standup summary from two days of git activity.
 */
export async function generateStandupSummary(
  apiKey: string,
  yesterday: GitActivity,
  today: GitActivity,
): Promise<string> {
  if (yesterday.commits.length === 0 && today.commits.length === 0) {
    return [
      "Yesterday:",
      "  • No activity recorded",
      "",
      "Today:",
      "  • No activity recorded",
      "",
      "Blockers:",
      "  • None",
    ].join("\n");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: STANDUP_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildStandupMessage(yesterday, today),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content");
  }

  return textBlock.text;
}

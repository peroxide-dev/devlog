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
    model: "claude-sonnet-4-20250514",
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

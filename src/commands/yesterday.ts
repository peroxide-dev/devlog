import { yesterdayDate } from "../utils/date.js";
import { summarizeForDate } from "./summarize.js";

export async function runYesterday(): Promise<void> {
  await summarizeForDate(yesterdayDate(), "🧠");
}

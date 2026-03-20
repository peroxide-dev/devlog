import { todayDate } from "../utils/date.js";
import { summarizeForDate } from "./summarize.js";

export async function runToday(): Promise<void> {
  await summarizeForDate(todayDate(), "🧠");
}

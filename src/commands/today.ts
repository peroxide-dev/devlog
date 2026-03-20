import { todayDate } from "../utils/date.js";
import { summarizeForDate } from "./summarize.js";

export async function runToday(): Promise<string> {
  const result = await summarizeForDate(todayDate(), "🧠");
  if (result) console.log(result);
  return result;
}

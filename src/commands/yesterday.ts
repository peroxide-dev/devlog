import { yesterdayDate } from "../utils/date.js";
import { summarizeForDate } from "./summarize.js";

export async function runYesterday(): Promise<string> {
  const result = await summarizeForDate(yesterdayDate(), "🧠");
  if (result) console.log(result);
  return result;
}

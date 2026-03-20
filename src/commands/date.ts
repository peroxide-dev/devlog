import { parseDate } from "../utils/date.js";
import { printError } from "../utils/format.js";
import { summarizeForDate } from "./summarize.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function runDate(dateInput: string): Promise<string> {
  if (!DATE_REGEX.test(dateInput)) {
    printError("Invalid date format. Use YYYY-MM-DD");
    process.exitCode = 1;
    return "";
  }

  const date = parseDate(dateInput);
  if (!date) {
    printError("Invalid date format. Use YYYY-MM-DD");
    process.exitCode = 1;
    return "";
  }

  const result = await summarizeForDate(date, "🧠");
  if (result) console.log(result);
  return result;
}

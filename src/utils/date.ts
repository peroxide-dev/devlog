import dayjs from "dayjs";

/**
 * Format a date string for display (e.g., "March 20, 2026").
 */
export function formatDisplayDate(date: string): string {
  return dayjs(date).format("MMMM D, YYYY");
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayDate(): string {
  return dayjs().format("YYYY-MM-DD");
}

/**
 * Get yesterday's date as YYYY-MM-DD.
 */
export function yesterdayDate(): string {
  return dayjs().subtract(1, "day").format("YYYY-MM-DD");
}

/**
 * Parse a date string and return YYYY-MM-DD, or null if invalid.
 */
export function parseDate(input: string): string | null {
  const parsed = dayjs(input);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.format("YYYY-MM-DD");
}

import { DateTime } from "luxon";

/**
 * Convert a date + "HH:mm" string into the correct UTC timestamp,
 * interpreting the time as IST (or therapist timezone).
 */
export function timeStrToDate(baseDate: Date, timeStr: string) {
  const [hour, minute] = timeStr.split(":").map(Number);

  // Therapist timezone (use dynamic later if needed)
  const tz = "Asia/Kolkata";

  // Build local datetime in IST
  const local = DateTime.fromObject(
    {
      year: baseDate.getFullYear(),
      month: baseDate.getMonth() + 1,
      day: baseDate.getDate(),
      hour,
      minute,
      second: 0,
      millisecond: 0
    },
    { zone: tz }
  );

  // Convert IST → UTC
  return local.toUTC().toJSDate();
}

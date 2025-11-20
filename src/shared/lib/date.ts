export function getDateRange(filter: string) {
  const now = new Date();

  switch (filter) {
    case "day": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    case "week": {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay());

      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      return { start, end };
    }

    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      return { start, end };
    }

    default:
      return null; // no filter → all records
  }
}


/**
 * Converts "HH:mm" to a Date object representing the correct UTC time
 * corresponding to that HH:mm in IST.
 *
 * Example:
 *  baseDate = 2025-11-20
 *  timeStr  = "10:00"
 *  returns  = 2025-11-20T04:30:00.000Z (which is 10:00 IST)
 */
export function timeStrToDate(baseDate: Date, timeStr: string) {
  const [hour, minute] = timeStr.split(":").map(Number);

  // Build a date string YYYY-MM-DD HH:mm in IST (Asia/Kolkata)
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(baseDate) + ` ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`;

  // Convert IST → UTC correctly using Date.parse (with timeZone)
  const utcTimestamp = Date.parse(dateStr + " GMT+0530");

  return new Date(utcTimestamp);
}

export function normalizeToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

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

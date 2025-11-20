// services/slot.service.ts
import {prisma} from '../../../../infrastructure/prisma/client';
import { addDays, startOfDay } from "date-fns";
import { normalizeToUTCDate, timeStrToDate } from '../../../../shared/lib/date';

const DAY_NAME_TO_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};


function getDatesInRange(start: Date, end: Date) {
   const dates: Date[] = [];

  let cur = normalizeToUTCDate(start);
  const last = normalizeToUTCDate(end);

  while (cur <= last) {
    dates.push(new Date(cur));
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
  }

  return dates;
}

function generateSlotsForInterval(dayDate: Date, startTime: string, endTime: string, durationMin: number) {
  const slots = [];
  let cursor = timeStrToDate(dayDate, startTime);
  const endDt = timeStrToDate(dayDate, endTime);

  while (cursor.getTime() + durationMin * 60000 <= endDt.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMin * 60000);
    slots.push({ start: slotStart, end: slotEnd });
    cursor = new Date(slotEnd);
  }
  return slots;
}

class SlotService {
  // generateSlots: given therapistId and date range ISO strings
  async generateSlots(payload: { therapistId: string; dateFrom: string; dateTo: string, availabilityId?: string }) {
    const { therapistId, dateFrom, dateTo } = payload;
    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    // Fetch active availabilities for therapist
    const activeAvail = await prisma.therapistAvailability.findMany({
      where: { therapistId, isActive: true }
    });
    if (!activeAvail || activeAvail.length === 0) return { created: 0 };

    const dates = getDatesInRange(start, end);

    const createManyData: any[] = [];
    const now = new Date();

    for (const d of dates) {
      const dow = d.getDay(); // 0..6
      // find availabilities that match day index
      const rowsForDay = activeAvail.filter((a) => {
        const idx = DAY_NAME_TO_INDEX[a.dayOfWeek as keyof typeof DAY_NAME_TO_INDEX];
        return idx === dow;
      });
      if (rowsForDay.length === 0) continue;

      for (const row of rowsForDay) {
        // if effectiveFrom/effectiveTo range check
        if (row.effectiveFrom && d < row.effectiveFrom) continue;
        if (row.effectiveTo && d > row.effectiveTo) continue;

        const intervalSlots = generateSlotsForInterval(d, row.startTime, row.endTime, row.slotDuration);

        for (const s of intervalSlots) {
          // skip past slots
          if (s.end <= now) continue;

          createManyData.push({
            id:  undefined, // Prisma will auto-generate if omitted
            availabilityId: row.id,
            therapistId,
            startDateTime: s.start,
            endDateTime: s.end,
            status: "AVAILABLE",
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (createManyData.length === 0) return { created: 0 };

    // Use createMany with skipDuplicates to avoid unique constraint errors
    // Prisma expects Date objects; ensure your DB supports skipDuplicates (Postgres does)
    const batchSize = 500; // safe batch size
    let createdCount = 0;
    for (let i = 0; i < createManyData.length; i += batchSize) {
      const chunk = createManyData.slice(i, i + batchSize);
      const res = await prisma.availabilitySlot.createMany({
        data: chunk.map(c => ({
          availabilityId: c.availabilityId,
          therapistId: c.therapistId,
          startDateTime: c.startDateTime,
          endDateTime: c.endDateTime,
          status: c.status,
        })),
        skipDuplicates: true
      });
      // createMany returns count in Prisma as number of created rows
      createdCount += (res.count ?? 0);
    }

    return { created: createdCount };
  }

  // optional helper to delete outdated available slots before regenerating (for update flow)
  async deleteUnbookedSlotsInRange(therapistId: string, dateFrom: Date, dateTo: Date) {
    await prisma.availabilitySlot.deleteMany({
      where: {
        therapistId,
        status: "AVAILABLE",
        startDateTime: { gte: dateFrom },
        endDateTime: { lte: dateTo }
      }
    });
  }
}

export default new SlotService();

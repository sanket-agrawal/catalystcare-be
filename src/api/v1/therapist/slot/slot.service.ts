// services/slot.service.ts
import {prisma} from '../../../../infrastructure/prisma/client';
import { timeStrToDate } from '../../../../shared/lib/date';

const DAY_NAME_TO_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

type Avail = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  isActive: boolean;
};



function stripTimeKeepDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getDatesInRange(start: Date, end: Date) {
  const dates: Date[] = [];
  let cur = stripTimeKeepDate(start);
  const last = stripTimeKeepDate(end);

  while (cur <= last) {
    dates.push(new Date(cur));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
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
// slot.service.ts (relevant changes)
async generateSlots(payload: { therapistId: string; dateFrom: string; dateTo: string; availabilityId?: string }) {
  const { therapistId, dateFrom, dateTo, availabilityId } = payload;
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  // Load availabilities scoped to availabilityId if provided
  const availWhere: any = { therapistId, isActive: true };
  if (availabilityId) {
    availWhere.id = availabilityId;
  }
  const activeAvail = await prisma.therapistAvailability.findMany({
    where: availWhere
  });

  if (!activeAvail || activeAvail.length === 0) return { created: 0 };

  const dates = getDatesInRange(start, end);
  const createManyData: any[] = [];
  const now = new Date();

  for (const d of dates) {
    const dow = d.getDay(); // 0..6
    const rowsForDay = activeAvail.filter((a: Avail) => {
      const idx = DAY_NAME_TO_INDEX[a.dayOfWeek];
      return idx === dow;
    });
    if (rowsForDay.length === 0) continue;

    for (const row of rowsForDay) {
      // effectiveFrom/effectiveTo date comparison — treat as UTC day boundaries
      if (row.effectiveFrom && d < new Date(row.effectiveFrom.toString())) continue;
      if (row.effectiveTo && d > new Date(row.effectiveTo.toString())) continue;

      const intervalSlots = generateSlotsForInterval(d, row.startTime, row.endTime, row.slotDuration);

      for (const s of intervalSlots) {
        // skip past slots
        if (s.end <= now) continue;

        createManyData.push({
          availabilityId: row.id,
          therapistId,
          startDateTime: s.start,
          endDateTime: s.end,
          status: "AVAILABLE",
        });
      }
    }
  }

  if (createManyData.length === 0) return { created: 0 };

  // batch create using skipDuplicates
  const batchSize = 500;
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

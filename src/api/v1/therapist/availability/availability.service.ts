import { DayOfWeek, SlotStatus} from "./availability.dto";
import { startOfDay, endOfDay, addDays, parseISO, format, parse, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import {prisma} from '../../../../infrastructure/prisma/client';
import ApiError from "../../../../shared/utils/ApiError";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { slotQueue } from "../../../../infrastructure/queues";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";


const timeZone = 'Asia/Kolkata';

export interface CreateAvailabilityInput {
  therapistId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; 
  endTime: string;  
  slotDuration?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface GenerateSlotsInput {
  therapistId: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateAvailabilityInput {
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  isActive?: boolean;
  effectiveFrom? : Date;
  effectiveTo?: Date;
}

export interface CreateMultipleAvailabilitiesInput {
  therapistId: string;
  availabilities: {
    dayOfWeek: DayOfWeek;
    intervals: { startTime: string; endTime: string }[];
    slotDuration?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }[];
}

export type GroupedSlots = {
  [date: string]: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    startDateTimeIST: string;
    endDateTimeIST: string;
  }[];
};

interface UpdateAvailabilityJobPayload {
  newAvailabilityId: string;
  therapistId: string;
  dateFrom: string;
  dateTo: string;
}


export class AvailabilityService{

    async createMultipleAvailabilities(input: CreateMultipleAvailabilitiesInput) {
  try {
    const { therapistId, availabilities } = input;

    const therapist = await prisma.therapistProfile.findUnique({ where: { id: therapistId } });
    if (!therapist) throw new ApiError(400, "Therapist not found");

    const createdAvailabilities = [];

    for (const day of availabilities) {
      const { dayOfWeek, intervals, slotDuration = 60, effectiveFrom, effectiveTo } = day;

      if (!effectiveFrom) throw new ApiError(400, `effectiveFrom is required for ${dayOfWeek}`);

      if (effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
        throw new ApiError(
          400,
          `effectiveTo (${effectiveTo}) cannot be earlier than effectiveFrom (${effectiveFrom}) for ${dayOfWeek}`
        );
      }

      for (const { startTime, endTime } of intervals) {
        // Validate time format
        this.validateTimeFormat(startTime);
        this.validateTimeFormat(endTime);

        // Ensure end time > start time
        if (!this.isEndTimeAfterStartTime(startTime, endTime)) {
          throw new ApiError(400, `End time ${endTime} must be after start time ${startTime} for ${dayOfWeek}`);
        }

        // Check overlapping availability for same day
        const overlapping = await this.checkOverlappingAvailability(
          therapistId,
          dayOfWeek,
          startTime,
          endTime,
          effectiveFrom
        );

        if (overlapping) {
          throw new ApiError(
            400,
            `Overlapping availability exists on ${dayOfWeek} for ${startTime}-${endTime}`
          );
        }

        // Create availability record
        const availability = await prisma.therapistAvailability.create({
          data: {
            therapistId,
            dayOfWeek,
            startTime,
            endTime,
            slotDuration,
            effectiveFrom,
            effectiveTo: effectiveTo || null,
            isActive: true,
          },
        });

        createdAvailabilities.push(availability);
      }
    }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      await slotQueue.add("generate_slots", {
        therapistId,
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      });

    return createdAvailabilities;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, (error as Error).message);
  }
    }


   async generateSlots(input: { therapistId: string; startDate: Date; endDate: Date }) {
    const { therapistId } = input;

    // Work in IST timezone
    let currentDate = startOfDay(toZonedTime(input.startDate, timeZone));
    const endDate = startOfDay(toZonedTime(input.endDate, timeZone));

    // Convert to UTC for database query
    const currentDateUTC = fromZonedTime(currentDate, timeZone);
    const endDateUTC = fromZonedTime(endDate, timeZone);

    // Fetch all active availabilities in this range
    const availabilities = await prisma.therapistAvailability.findMany({
      where: {
        therapistId,
        isActive: true,
        effectiveFrom: { lte: endDateUTC },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: currentDateUTC } }],
      },
    });

    const slotsToCreate: any[] = [];

    const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
      // Map currentDate to weekday string
      const dayOfWeek = DAYS[currentDate.getDay()];

      // Convert currentDate to UTC for comparison
      const currentDateUTC = fromZonedTime(currentDate, timeZone);

      // Filter availabilities for this day - FIXED LOGIC
      const dayAvailabilities = availabilities.filter((a : typeof availabilities[number]) => {
        // Must match day of week
        if (a.dayOfWeek !== dayOfWeek) return false;
        
        // Must be after or on effectiveFrom
        if (isAfter(a.effectiveFrom, currentDateUTC)) return false;
        
        // Must be before or on effectiveTo (if it exists)
        if (a.effectiveTo && isAfter(currentDateUTC, a.effectiveTo)) return false;
        
        return true;
      });

      for (const availability of dayAvailabilities) {
        const slots = this.generateSlotsForDay(
          currentDate,
          availability.startTime,
          availability.endTime,
          availability.slotDuration,
          therapistId,
          availability.id
        );
        slotsToCreate.push(...slots);
      }

      currentDate = addDays(currentDate, 1);
    }

    // Remove duplicate slots
    const uniqueSlots = await this.filterExistingSlots(slotsToCreate);

    if (uniqueSlots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: uniqueSlots,
        skipDuplicates: true,
      });
    }

    return {
      slotsCreated: uniqueSlots.length,
      dateRange: { startDate: input.startDate, endDate: input.endDate },
    };
  }

async getAvailableSlots(therapistId: string) {
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      therapistId,
      status: { not: "CANCELLED" }
    },
    orderBy: { startDateTime: "asc" },
    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      status: true
    }
  });

  // Convert UTC → IST & group by date
  const grouped : GroupedSlots = {};

  for (const s of slots) {
    const startIST = DateTime.fromJSDate(s.startDateTime, { zone: "utc" }).setZone("Asia/Kolkata");
    const endIST   = DateTime.fromJSDate(s.endDateTime, { zone: "utc" }).setZone("Asia/Kolkata");

    // Format: YYYY-MM-DD
    const dayKey = startIST.toFormat("yyyy-MM-dd");

    if (!grouped[dayKey]) grouped[dayKey] = [];

    grouped[dayKey].push({
      id: s.id,
      startTime: startIST.toFormat("HH:mm"),
      endTime: endIST.toFormat("HH:mm"),
      status: s.status,
      startDateTimeIST: startIST.toISO()!,
      endDateTimeIST: endIST.toISO()!
    });
  }

  return grouped;
}


    async getTherapistWithAvailability(therapistId: string, daysAhead: number = 30) {
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true
          }
        },
        categories: true,
        subCategories: true
      }
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    const availableSlots = await this.getAvailableSlots(therapistId);

    return {
      ...therapist,
      availableSlots,
      slotSummary: {
        totalAvailable: Object.values(availableSlots).flat().length,
        daysWithAvailability: Object.keys(availableSlots).length
      }
    };
    }

    async updateAvailability(availabilityId: string, input: UpdateAvailabilityInput, therapistId : string) {
      try{
        if (!availabilityId) throw new ApiError(400, "availabilityId is required");
    const old = await prisma.therapistAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!old) {
      throw new ApiError(404,'Availability not found');
    }

    if(old.therapistId !== therapistId){
      throw new ApiError(403, "Unauthorized availability update");
    }

    // Validate times if provided
    const newStart = input.startTime ?? old.startTime;
    const newEnd = input.endTime ?? old.endTime;

    //     if (!this.validateTimeFormat(newStart) || !this.validateTimeFormat(newEnd)) {
    //   throw new ApiError(400, "Invalid time format. Expected HH:mm");
    // }

    if (!this.isEndTimeAfterStartTime(newStart, newEnd)) {
      throw new ApiError(400, "End time must be after start time");
    }


    if (input.startTime) this.validateTimeFormat(input.startTime);
    if (input.endTime) this.validateTimeFormat(input.endTime);

    if (input.startTime && input.endTime && !this.isEndTimeAfterStartTime(input.startTime, input.endTime)) {
      throw new ApiError(400,'End time must be after start time');
    }

    const now = new Date();
    const effectiveFromDate = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(); // default to now
    const effectiveToDate = input.effectiveTo ? new Date(input.effectiveTo as any) : (old.effectiveTo ?? null);

        if (effectiveToDate && effectiveToDate < effectiveFromDate) {
      throw new ApiError(400, "effectiveTo cannot be earlier than effectiveFrom");
    }


    //   await prisma.therapistAvailability.updateMany({
    //   where: { id: availabilityId },
    //   data: {
    //     isActive: false,
    //     effectiveTo: new Date()
    //   }
    // });

    //  const newData = {
    //   therapistId,
    //   dayOfWeek: old.dayOfWeek,
    //   startTime: input.startTime ?? old.startTime,
    //   endTime: input.endTime ?? old.endTime,
    //   slotDuration: input.slotDuration ?? old.slotDuration,
    //   effectiveFrom: input.effectiveFrom
    //     ? new Date(input.effectiveFrom)
    //     : old.effectiveFrom,
    //   effectiveTo: input.effectiveTo
    //     ? new Date(input.effectiveTo)
    //     : old.effectiveTo,
    //   isActive: true
    // };

    // const newAvailability = await prisma.therapistAvailability.create({
    //   data: newData
    // });

    // const now2 = new Date();
    // const end = new Date();
    // end.setDate(now.getDate() + 30);

    // await slotQueue.add("update_single_availability", {
    //   therapistId,
    //   oldAvailabilityId: availabilityId,
    //   newAvailabilityId: newAvailability.id,
    //   dateFrom: now.toISOString(),
    //   dateTo: end.toISOString()
    // });


    // return newAvailability;
    return await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
      // overlap check against other active availabilities
      const overlaps = await this.checkOverlappingAvailabilityTx(
        tx,
        old.therapistId,
        old.dayOfWeek,
        newStart,
        newEnd,
        availabilityId, // ignore current availability
        effectiveFromDate,
        effectiveToDate
      );

      if (overlaps) {
        throw new ApiError(400, "Overlapping availability exists with existing records");
      }

      // Mark the old record's effectiveTo to now (freeze history). Keep isActive true for historical audit.
      const nowUtc = new Date();
      await tx.therapistAvailability.update({
        where: { id: availabilityId },
        data: {
          effectiveTo: nowUtc
          // do not set isActive=false — keep historical record
        }
      });

      // Create new availability record (version bumped)
      const newVersion = (old.version ?? 1) + 1;
      const newAvailability = await tx.therapistAvailability.create({
        data: {
          therapistId: old.therapistId,
          dayOfWeek: old.dayOfWeek,
          startTime: newStart,
          endTime: newEnd,
          slotDuration: input.slotDuration ?? old.slotDuration,
          effectiveFrom: effectiveFromDate,
          effectiveTo: effectiveToDate ?? null,
          isActive: true,
          version: newVersion
        }
      });

      // Delete unbooked (AVAILABLE) future slots for OLD availability only (do not touch BOOKED/LOCKED)
      await tx.availabilitySlot.deleteMany({
        where: {
          availabilityId: availabilityId,
          status: "AVAILABLE",
          startDateTime: { gte: nowUtc }
        }
      });

      // After commit, we want to generate slots only for the NEW availability.
      // But we're inside transaction; queue job after tx completes. We'll return payload containing necessary info.
      return {
        newAvailabilityId: newAvailability.id,
        therapistId: newAvailability.therapistId,
        dateFrom: nowUtc.toISOString(),
        // dateTo = now + 30 days
        dateTo: DateTime.fromJSDate(nowUtc).plus({ days: 30 }).toUTC().toISO()
      };
    }).then(async (jobPayload: UpdateAvailabilityJobPayload) => {
      // queue job idempotently so retries don't create duplicate jobs
      const jobId = `update_single_availability_${jobPayload.newAvailabilityId}_${jobPayload.dateFrom.slice(0,10)}`;
      await slotQueue.add(
        "update_single_availability",
        {
          therapistId: jobPayload.therapistId,
          oldAvailabilityId: availabilityId,
          newAvailabilityId: jobPayload.newAvailabilityId,
          dateFrom: jobPayload.dateFrom,
          dateTo: jobPayload.dateTo
        },
        { jobId, removeOnComplete: true, removeOnFail: { age: 86400 } }
      );

      // return the newly created availability object for API response
      const created = await prisma.therapistAvailability.findUnique({ where: { id: jobPayload.newAvailabilityId } });
      return created;
    }).catch((err : unknown) => {
      // bubble ApiError
      if (err instanceof ApiError) throw err;
      throw new ApiError(400, (err as Error).message);
    });
  
    }catch(error){
       if (error instanceof ApiError) throw error;
      throw new ApiError(400, (error as Error).message);
    }
    }

    async deleteAvailability(availabilityId: string, therapistId: string) {
  const now = new Date();

  return await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
    // 1. Fetch availability
    const availability = await tx.therapistAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability) {
      throw new ApiError(404, "Availability not found");
    }

    if (availability.therapistId !== therapistId) {
      throw new ApiError(403, "Unauthorized availability delete");
    }

    // 2. Check for future booked slots
    const bookedSlots = await tx.availabilitySlot.findFirst({
      where: {
        availabilityId,
        status: "BOOKED",
        startDateTime: { gte: now }
      }
    });

    if (bookedSlots) {
      throw new ApiError(
        400,
        "Cannot delete availability because booked sessions exist in the future"
      );
    }

    // 3. Soft delete the availability
    await tx.therapistAvailability.update({
      where: { id: availabilityId },
      data: {
        isActive: false,
        effectiveTo: now
      }
    });

    // 4. Delete future AVAILABLE slots for this availability
    await tx.availabilitySlot.deleteMany({
      where: {
        availabilityId,
        status: "AVAILABLE",
        startDateTime: { gte: now }
      }
    });

    return { deleted: true };
  });
}


  async blockSlot(slotId: string) {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId }
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new Error('Slot is not available');
    }

    return await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status: SlotStatus.BLOCKED }
    });
  }

  async unblockSlot(slotId: string) {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId }
    });

    if (!slot || slot.status !== SlotStatus.BLOCKED) {
      throw new Error('Slot not found or not blocked');
    }

    return await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status: SlotStatus.AVAILABLE }
    });
  }

async fetchAvailabilityRules(therapistId: string) {
  try {
    const today = new Date();

    const [availabilities, profile] = await Promise.all([
      prisma.therapistAvailability.findMany({
        where: {
          therapistId,
          isActive: true,
          OR: [
            { effectiveTo: null },               // no end date
            { effectiveTo: { gte: today } }      // still active
          ]
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      }),

      prisma.therapistProfile.findUnique({
        where: { id: therapistId },
        select: { googleUserId: true }
      })
    ]);

    const calendarConnected = !!profile?.googleUserId;
    const availabilityCreated = availabilities.length > 0;

    // Group availability by day
    const grouped: Record<string, any[]> = {};

    for (const a of availabilities) {
      if (!grouped[a.dayOfWeek]) grouped[a.dayOfWeek] = [];
      grouped[a.dayOfWeek].push({
        id: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDuration: a.slotDuration,
        effectiveFrom: a.effectiveFrom,
        effectiveTo: a.effectiveTo
      });
    }

    return {
      availabilityByDay: grouped,
      availabilityFlat: availabilities,
      timelineData: {
        calendarConnected,
        availabilityCreated,
        setToTakeBookings: calendarConnected && availabilityCreated
      }
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, (error as Error).message);
  }
}

  

  // PRIVATE Helpers
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected HH:mm (24-hour format)`);
    }
  }

  private isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    return (endHour > startHour) || (endHour === startHour && endMin > startMin);
  }

  private async checkOverlappingAvailability(
    therapistId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    effectiveFrom?: Date
  ): Promise<boolean> {
    const overlapping = await prisma.therapistAvailability.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        isActive: true,
        AND: [
        {
          startTime: { lt: endTime }, 
        },
        {
          endTime: { gt: startTime },
        },
      ],
      }
    });

    return !!overlapping;
  }

   private async checkOverlappingAvailabilityTx(
    tx: Prisma.TransactionClient,
    therapistId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    ignoreAvailabilityId?: string,
    effectiveFrom?: Date,
    effectiveTo?: Date | null
  ): Promise<boolean> {
    const where: any = {
      therapistId,
      dayOfWeek,
      isActive: true,
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } }
      ],
    };

    if (ignoreAvailabilityId) {
      where.AND.push({ id: { not: ignoreAvailabilityId } });
    }

    // If effectiveFrom/To provided, ensure effective ranges intersect (existing.effectiveTo NULL means open)
    if (effectiveFrom) {
      where.AND.push({
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: effectiveFrom } }
        ]
      });
    }
    if (effectiveTo) {
      where.AND.push({ effectiveFrom: { lte: effectiveTo } });
    }

    const overlapping = await tx.therapistAvailability.findFirst({ where });
    return !!overlapping;
  }

  private generateSlotsForDay(
    date: Date,
    startTime: string,
    endTime: string,
    slotDuration: number,
    therapistId: string,
    availabilityId: string
  ) {
    const slots: any[] = [];

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Create date in IST timezone
    let slotStart = new Date(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate(), 
      startHour, 
      startMinute
    );

    const slotEnd = new Date(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate(), 
      endHour, 
      endMinute
    );

    while (slotStart < slotEnd) {
      const nextSlot = new Date(slotStart.getTime() + slotDuration * 60000);

      if (nextSlot <= slotEnd) {
        // Convert to UTC for database storage
        const startUTC = fromZonedTime(slotStart, timeZone);
        const endUTC = fromZonedTime(nextSlot, timeZone);

        slots.push({
          therapistId,
          availabilityId,
          startDateTime: startUTC,
          endDateTime: endUTC,
          status: SlotStatus.AVAILABLE,
        });
      }

      slotStart = nextSlot;
    }

    return slots;
  }

  private async filterExistingSlots(slots: any[]) {
    if (slots.length === 0) return [];

    const orConditions = slots.map((s) => ({
      therapistId: s.therapistId,
      startDateTime: s.startDateTime,
      endDateTime: s.endDateTime,
    }));

    const existing = await prisma.availabilitySlot.findMany({
      where: {
        OR: orConditions,
      },
      select: { therapistId: true, startDateTime: true, endDateTime: true },
    });

    const existingSet = new Set(
      existing.map((e : typeof existing[number]) => e.therapistId + e.startDateTime.toISOString() + e.endDateTime.toISOString())
    );

    return slots.filter(
      (s) => !existingSet.has(s.therapistId + s.startDateTime.toISOString() + s.endDateTime.toISOString())
    );
  }

  private groupSlotsByDate(slots: any[]) {
    return slots.reduce((acc, slot) => {
      // Convert to IST for display
      const slotInIST = toZonedTime(slot.startDateTime, timeZone);
      const dateKey = format(slotInIST, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push({
        id: slot.id,
        startTime: format(toZonedTime(slot.startDateTime, timeZone), 'HH:mm'),
        endTime: format(toZonedTime(slot.endDateTime, timeZone), 'HH:mm'),
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime,
        status : slot.status
      });
      return acc;
    }, {} as Record<string, any[]>);
  }

}

export const availabilityService = new AvailabilityService();
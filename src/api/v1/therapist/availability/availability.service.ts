import { DayOfWeek, SlotStatus} from "./availability.dto";
import { startOfDay, endOfDay, addDays, parseISO, format, parse, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import {prisma} from '../../../../infrastructure/prisma/client';
import ApiError from "../../../../shared/utils/ApiError";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { slotQueue } from "../../../../infrastructure/queues";


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

export class AvailabilityService{

    async createAvailability(input: CreateAvailabilityInput) {
    try {
      const { therapistId, dayOfWeek, startTime, endTime, slotDuration = 60, effectiveFrom, effectiveTo } = input;

      this.validateTimeFormat(startTime);
      this.validateTimeFormat(endTime);

      if (!this.isEndTimeAfterStartTime(startTime, endTime))
        throw new ApiError(400, "End time must be after start time");

      const therapist = await prisma.therapistProfile.findUnique({ where: { id: therapistId } });
      if (!therapist) throw new ApiError(400, "Therapist not found");

      if(!therapist.googleUserId){
        throw new ApiError(400, "Therapist has not connected Google Calendar");
      }

      const overlapping = await this.checkOverlappingAvailability(
        therapistId,
        dayOfWeek,
        startTime,
        endTime,
        effectiveFrom
      );
      if (overlapping) throw new ApiError(400, "Overlapping availability exists for this day slot");

      // Store times as strings, dates as UTC
      const availability = await prisma.therapistAvailability.create({
        data: {
          therapistId,
          dayOfWeek,
          startTime,
          endTime,
          slotDuration,
          effectiveFrom: effectiveFrom,
          effectiveTo: effectiveTo || null,
          isActive: true,
        },
      });

      return availability;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, (error as Error).message);
    }
    }

    async createMultipleAvailabilities(input: CreateMultipleAvailabilitiesInput) {
  try {
    const { therapistId, availabilities } = input;

    const therapist = await prisma.therapistProfile.findUnique({ where: { id: therapistId } });
    if (!therapist) throw new ApiError(400, "Therapist not found");

    const createdAvailabilities = [];

    for (const day of availabilities) {
      const { dayOfWeek, intervals, slotDuration = 60, effectiveFrom, effectiveTo } = day;

      if (!effectiveFrom) throw new ApiError(400, `effectiveFrom is required for ${dayOfWeek}`);

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
        status: {not : SlotStatus.CANCELLED},
      },
      orderBy: {
        startDateTime: 'asc'
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true
      }
    });

    return this.groupSlotsByDate(slots);
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
    const old = await prisma.therapistAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!old) {
      throw new ApiError(404,'Availability not found');
    }

    if(old.therapistId !== therapistId){
      throw new ApiError(403, "Unauthorized availability update");
    }

    if (input.startTime) this.validateTimeFormat(input.startTime);
    if (input.endTime) this.validateTimeFormat(input.endTime);

    if (input.startTime && input.endTime && !this.isEndTimeAfterStartTime(input.startTime, input.endTime)) {
      throw new ApiError(400,'End time must be after start time');
    }

      await prisma.therapistAvailability.updateMany({
      where: { id: availabilityId },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });

     const newData = {
      therapistId,
      dayOfWeek: old.dayOfWeek,
      startTime: input.startTime ?? old.startTime,
      endTime: input.endTime ?? old.endTime,
      slotDuration: input.slotDuration ?? old.slotDuration,
      effectiveFrom: input.effectiveFrom
        ? new Date(input.effectiveFrom)
        : old.effectiveFrom,
      effectiveTo: input.effectiveTo
        ? new Date(input.effectiveTo)
        : old.effectiveTo,
      isActive: true
    };

    const newAvailability = await prisma.therapistAvailability.create({
      data: newData
    });

    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 30);

    await slotQueue.add("update_single_availability", {
      therapistId,
      oldAvailabilityId: availabilityId,
      newAvailabilityId: newAvailability.id,
      dateFrom: now.toISOString(),
      dateTo: end.toISOString()
    });


    return newAvailability;

    // return await prisma.therapistAvailability.update({
    //   where: { id: availabilityId },
    //   data: input
    // });
  
    }catch(error){
       if (error instanceof ApiError) throw error;
      throw new ApiError(400, (error as Error).message);
    }
  }

    async deleteAvailability(availabilityId: string) {
      try{
             // Soft delete by setting isActive to false and effectiveTo to now
    return await prisma.therapistAvailability.update({
      where: { id: availabilityId },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });
      }catch(error){
        if (error instanceof ApiError) throw error;
      throw new ApiError(400, (error as Error).message);
      }

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

  async blockDate(therapistId: string, date: Date) {
    // Convert to IST and get start/end of day
    const startOfDayIST = startOfDay(toZonedTime(date, timeZone));
    const endOfDayIST = endOfDay(toZonedTime(date, timeZone));
    
    // Convert back to UTC for DB query
    const startOfDayUTC = fromZonedTime(startOfDayIST, timeZone);
    const endOfDayUTC = fromZonedTime(endOfDayIST, timeZone);

    const result = await prisma.availabilitySlot.updateMany({
      where: {
        therapistId,
        status: SlotStatus.AVAILABLE,
        startDateTime: {
          gte: startOfDayUTC,
          lt: endOfDayUTC
        }
      },
      data: {
        status: SlotStatus.BLOCKED
      }
    });

    return result;
  }

  async unblockDate(therapistId: string, date: Date) {
    // Convert to IST and get start/end of day
    const startOfDayIST = startOfDay(toZonedTime(date, timeZone));
    const endOfDayIST = endOfDay(toZonedTime(date, timeZone));
    
    // Convert back to UTC for DB query
    const startOfDayUTC = fromZonedTime(startOfDayIST, timeZone);
    const endOfDayUTC = fromZonedTime(endOfDayIST, timeZone);

    const result = await prisma.availabilitySlot.updateMany({
      where: {
        therapistId,
        status: SlotStatus.BLOCKED,
        startDateTime: {
          gte: startOfDayUTC,
          lt: endOfDayUTC
        }
      },
      data: {
        status: SlotStatus.AVAILABLE
      }
    });

    return result;
  }

async fetchAvailabilityRules(therapistId: string) {
  try {
    // Run DB queries in parallel
    const [availabilities, profile] = await Promise.all([
      prisma.therapistAvailability.findMany({
        where: { therapistId, isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      }),
      prisma.therapistProfile.findUnique({
        where: { id: therapistId },
        select: { googleUserId: true }
      })
    ]);

    const calendarConnected = !!profile?.googleUserId;
    const availabilityCreated = availabilities.length > 0;

    return {
      availabilities,
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
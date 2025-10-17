import { DayOfWeek, SlotStatus} from "@prisma/client";
import { startOfDay, endOfDay, addDays, parseISO, format, parse, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import {prisma} from '../../../../infrastructure/prisma/client';

export interface CreateAvailabilityInput {
  therapistId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDuration?: number; // minutes (default: 60)
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
  effectiveTo?: Date;
}

export class AvailabilityService{

    async createAvailability(input: CreateAvailabilityInput) {
    const { therapistId, dayOfWeek, startTime, endTime, slotDuration = 60, effectiveFrom, effectiveTo } = input;

    // Validate time format
    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);

    // Validate that end time is after start time
    if (!this.isEndTimeAfterStartTime(startTime, endTime)) {
      throw new Error('End time must be after start time');
    }

    // Check if therapist exists
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId }
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    const overlapping = await this.checkOverlappingAvailability(
      therapistId,
      dayOfWeek,
      startTime,
      endTime,
      effectiveFrom
    );

    if (overlapping) {
      throw new Error('Overlapping availability exists for this time slot');
    }

    // Create availability
    const availability = await prisma.therapistAvailability.create({
      data: {
        therapistId,
        dayOfWeek,
        startTime,
        endTime,
        slotDuration,
        effectiveFrom: effectiveFrom || new Date(),
        effectiveTo,
        isActive: true
      }
    });

    return availability;
    }

    async generateSlots(input: GenerateSlotsInput) {
    const { therapistId, startDate, endDate } = input;

    // Get all active availability rules for this therapist
    const availabilities = await prisma.therapistAvailability.findMany({
      where: {
        therapistId,
        isActive: true,
        effectiveFrom: { lte: endDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: startDate } }
        ]
      }
    });
    const slotsToCreate = [];
    let currentDate = startOfDay(startDate);

    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      
      // Find availability rules for this day
      const dayAvailabilities = availabilities.filter(
        a => a.dayOfWeek === dayOfWeek &&
        (isBefore(currentDate, a.effectiveFrom) === false) &&
        (!a.effectiveTo || isBefore(currentDate, a.effectiveTo) === false)
      );

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

    // Filter out slots that already exist
    const uniqueSlots = await this.filterExistingSlots(slotsToCreate);

    // Bulk create slots
    if (uniqueSlots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: uniqueSlots,
        skipDuplicates: true
      });
    }

    return {
      slotsCreated: uniqueSlots.length,
      dateRange: { startDate, endDate }
    };
    }

    async getAvailableSlots(therapistId: string, startDate: Date, endDate: Date) {
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        therapistId,
        status: SlotStatus.AVAILABLE,
        startDateTime: {
          gte: startDate,
          lte: endDate
        }
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
    const startDate = new Date();
    const endDate = addDays(startDate, daysAhead);

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

    const availableSlots = await this.getAvailableSlots(therapistId, startDate, endDate);

    return {
      ...therapist,
      availableSlots,
      slotSummary: {
        totalAvailable: Object.values(availableSlots).flat().length,
        daysWithAvailability: Object.keys(availableSlots).length
      }
    };
    }

    async updateAvailability(availabilityId: string, input: UpdateAvailabilityInput) {
    const availability = await prisma.therapistAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability) {
      throw new Error('Availability not found');
    }

    if (input.startTime) this.validateTimeFormat(input.startTime);
    if (input.endTime) this.validateTimeFormat(input.endTime);

    if (input.startTime && input.endTime && !this.isEndTimeAfterStartTime(input.startTime, input.endTime)) {
      throw new Error('End time must be after start time');
    }

    return await prisma.therapistAvailability.update({
      where: { id: availabilityId },
      data: input
    });
    }

    async deleteAvailability(availabilityId: string) {
    // Soft delete by setting isActive to false and effectiveTo to now
    return await prisma.therapistAvailability.update({
      where: { id: availabilityId },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
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
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: effectiveFrom || new Date() } }
        ],
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      }
    });

    return !!overlapping;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  private generateSlotsForDay(
    date: Date,
    startTime: string,
    endTime: string,
    slotDuration: number,
    therapistId: string,
    availabilityId: string
  ) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentSlotStart = new Date(date);
    currentSlotStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);

    while (isBefore(currentSlotStart, dayEnd)) {
      const slotEnd = addMinutes(currentSlotStart, slotDuration);
      
      if (isAfter(slotEnd, dayEnd)) break;

      slots.push({
        availabilityId,
        therapistId,
        startDateTime: new Date(currentSlotStart),
        endDateTime: new Date(slotEnd),
        status: SlotStatus.AVAILABLE
      });

      currentSlotStart = slotEnd;
    }

    return slots;
  }

  private async filterExistingSlots(slots: any[]) {
    const slotChecks = slots.map(slot =>
      prisma.availabilitySlot.findFirst({
        where: {
          therapistId: slot.therapistId,
          startDateTime: slot.startDateTime
        }
      })
    );

    const existingSlots = await Promise.all(slotChecks);
    
    return slots.filter((_, index) => !existingSlots[index]);
  }

  private groupSlotsByDate(slots: any[]) {
    return slots.reduce((acc, slot) => {
      const dateKey = format(slot.startDateTime, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: slot.id,
        startTime: format(slot.startDateTime, 'HH:mm'),
        endTime: format(slot.endDateTime, 'HH:mm'),
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime
      });
      return acc;
    }, {} as Record<string, any[]>);
  }

}

export const availabilityService = new AvailabilityService();
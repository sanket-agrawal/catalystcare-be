import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import slotService from "./slot.service";
import { prisma } from "../../../../infrastructure/prisma/client";

vi.mock("../../../../infrastructure/prisma/client", () => ({
  prisma: {
    therapistAvailability: {
      findMany: vi.fn(),
    },
    availabilitySlot: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("Slot Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateSlots", () => {
    it("should return { created: 0 } when no active availabilities are found", async () => {
      (prisma.therapistAvailability.findMany as any).mockResolvedValue([]);

      const result = await slotService.generateSlots({
        therapistId: "therapist-1",
        dateFrom: "2026-06-01T00:00:00Z",
        dateTo: "2026-06-02T00:00:00Z",
      });

      expect(prisma.therapistAvailability.findMany).toHaveBeenCalledWith({
        where: { therapistId: "therapist-1", isActive: true },
      });
      expect(result).toEqual({ created: 0 });
    });

    it("should generate slots and insert them via createMany", async () => {
      // Mock availability for a Monday (June 1st, 2026 is a Monday)
      const mockAvailabilities = [
        {
          id: "avail-1",
          therapistId: "therapist-1",
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "11:00",
          slotDuration: 60,
          effectiveFrom: null,
          effectiveTo: null,
          isActive: true,
        },
      ];

      (prisma.therapistAvailability.findMany as any).mockResolvedValue(mockAvailabilities);
      (prisma.availabilitySlot.createMany as any).mockResolvedValue({ count: 2 });

      // Use a date range in the future to ensure slots are not filtered out as past slots
      const dateFrom = "2026-06-01T00:00:00Z";
      const dateTo = "2026-06-01T23:59:59Z";

      const result = await slotService.generateSlots({
        therapistId: "therapist-1",
        dateFrom,
        dateTo,
      });

      expect(prisma.therapistAvailability.findMany).toHaveBeenCalled();
      expect(prisma.availabilitySlot.createMany).toHaveBeenCalled();
      expect(result).toEqual({ created: 2 });

      // Check arguments passed to createMany
      const createManyArg = (prisma.availabilitySlot.createMany as any).mock.calls[0][0];
      expect(createManyArg.data).toHaveLength(2);
      expect(createManyArg.data[0]).toMatchObject({
        availabilityId: "avail-1",
        therapistId: "therapist-1",
        status: "AVAILABLE",
      });
      expect(createManyArg.skipDuplicates).toBe(true);
    });

    it("should respect effectiveFrom and effectiveTo availability date filters", async () => {
      const mockAvailabilities = [
        {
          id: "avail-1",
          therapistId: "therapist-1",
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          slotDuration: 60,
          effectiveFrom: new Date("2026-06-05T00:00:00Z"), // after June 1st
          effectiveTo: null,
          isActive: true,
        },
      ];

      (prisma.therapistAvailability.findMany as any).mockResolvedValue(mockAvailabilities);

      const result = await slotService.generateSlots({
        therapistId: "therapist-1",
        dateFrom: "2026-06-01T00:00:00Z",
        dateTo: "2026-06-01T23:59:59Z",
      });

      // No slots should be created because the current date (June 1st) is before effectiveFrom (June 5th)
      expect(result).toEqual({ created: 0 });
      expect(prisma.availabilitySlot.createMany).not.toHaveBeenCalled();
    });

    it("should support filtering by availabilityId if provided", async () => {
      (prisma.therapistAvailability.findMany as any).mockResolvedValue([]);

      await slotService.generateSlots({
        therapistId: "therapist-1",
        dateFrom: "2026-06-01T00:00:00Z",
        dateTo: "2026-06-02T00:00:00Z",
        availabilityId: "avail-specific",
      });

      expect(prisma.therapistAvailability.findMany).toHaveBeenCalledWith({
        where: { therapistId: "therapist-1", isActive: true, id: "avail-specific" },
      });
    });
  });

  describe("deleteUnbookedSlotsInRange", () => {
    it("should delete only available slots in the given date range", async () => {
      (prisma.availabilitySlot.deleteMany as any).mockResolvedValue({ count: 5 });

      const dateFrom = new Date("2026-06-01T00:00:00Z");
      const dateTo = new Date("2026-06-02T00:00:00Z");

      await slotService.deleteUnbookedSlotsInRange("therapist-1", dateFrom, dateTo);

      expect(prisma.availabilitySlot.deleteMany).toHaveBeenCalledWith({
        where: {
          therapistId: "therapist-1",
          status: "AVAILABLE",
          startDateTime: { gte: dateFrom },
          endDateTime: { lte: dateTo },
        },
      });
    });
  });
});

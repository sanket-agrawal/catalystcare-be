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
      // Mock availability for a Monday
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

      // Dynamically get a future Monday to ensure slots are not filtered out as past slots
      const today = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const year = nextMonday.getFullYear();
      const month = String(nextMonday.getMonth() + 1).padStart(2, "0");
      const day = String(nextMonday.getDate()).padStart(2, "0");

      const dateFrom = `${year}-${month}-${day}T00:00:00Z`;
      const dateTo = `${year}-${month}-${day}T23:59:59Z`;

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
      // Dynamically get a future Monday
      const today = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const year = nextMonday.getFullYear();
      const month = String(nextMonday.getMonth() + 1).padStart(2, "0");
      const day = String(nextMonday.getDate()).padStart(2, "0");

      const dateFrom = `${year}-${month}-${day}T00:00:00Z`;
      const dateTo = `${year}-${month}-${day}T23:59:59Z`;

      // Set effectiveFrom to 4 days after the dynamic Monday (which would be Friday)
      const effectiveFromDate = new Date(nextMonday);
      effectiveFromDate.setDate(nextMonday.getDate() + 4);

      const mockAvailabilities = [
        {
          id: "avail-1",
          therapistId: "therapist-1",
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          slotDuration: 60,
          effectiveFrom: effectiveFromDate,
          effectiveTo: null,
          isActive: true,
        },
      ];

      (prisma.therapistAvailability.findMany as any).mockResolvedValue(mockAvailabilities);

      const result = await slotService.generateSlots({
        therapistId: "therapist-1",
        dateFrom,
        dateTo,
      });

      // No slots should be created because the selected Monday is before effectiveFrom (Friday)
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

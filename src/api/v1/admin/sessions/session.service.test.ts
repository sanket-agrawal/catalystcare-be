import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminSessionService from "./session.service";
import { prisma } from "../../../../infrastructure/prisma/client";
import { emailQueue, meetingQueue } from "../../../../infrastructure/queues";
import ApiError from "../../../../shared/utils/ApiError";

vi.mock("../../../../infrastructure/prisma/client", () => {
  const mockPrisma = {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    availabilitySlot: {
      update: vi.fn(),
    },
    payment: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("../../../../infrastructure/queues", () => ({
  emailQueue: {
    add: vi.fn(),
  },
  meetingQueue: {
    add: vi.fn(),
  },
}));

describe("AdminSessionService.cancelBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully cancel booking, free slot, update payment, delete meet and send emails", async () => {
    const mockBooking = {
      id: "booking-1",
      slotId: "slot-1",
      startDateTime: new Date("2026-07-20T10:00:00.000Z"),
      endDateTime: new Date("2026-07-20T11:00:00.000Z"),
      status: "CONFIRMED",
      isActive: true,
      calendarEventId: "gcal-1",
      client: {
        user: {
          firstName: "John",
          lastName: "Client",
          email: "client@example.com",
        },
      },
      therapist: {
        user: {
          firstName: "Jane",
          lastName: "Therapist",
          email: "therapist@example.com",
        },
      },
      payment: {
        id: "payment-1",
        status: "CAPTURED",
      },
    };

    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

    const result = await AdminSessionService.cancelBooking("booking-1", "Client request");

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      include: expect.any(Object),
    });

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: expect.objectContaining({
        status: "CANCELLED",
        isActive: false,
        meetingLink: null,
        calendarEventId: null,
        meetingProvider: null,
        cancelledBy: "ADMIN",
        cancellationReason: "Client request",
      }),
    });

    expect(prisma.availabilitySlot.update).toHaveBeenCalledWith({
      where: { id: "slot-1" },
      data: {
        status: "AVAILABLE",
        clientId: null,
      },
    });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-1" },
      data: {
        status: "REFUNDED",
        refundedAt: expect.any(Date),
      },
    });

    expect(meetingQueue.add).toHaveBeenCalledWith(
      "delete-google-calendar-event",
      { bookingId: "booking-1" },
      expect.any(Object)
    );

    expect(emailQueue.add).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it("should throw 404 error when booking is not found", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

    await expect(
      AdminSessionService.cancelBooking("invalid-booking-id", "test")
    ).rejects.toThrowError(new ApiError(404, "Booking not found"));
  });

  it("should throw 400 error when booking is already cancelled", async () => {
    const mockBooking = {
      id: "booking-1",
      status: "CANCELLED",
      isActive: false,
    };
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

    await expect(AdminSessionService.cancelBooking("booking-1", "test")).rejects.toThrowError(
      new ApiError(400, "Booking is already cancelled or inactive")
    );
  });
});

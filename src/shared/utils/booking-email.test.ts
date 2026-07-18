import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/prisma/client";
import { emailQueue } from "../../infrastructure/queues";
import { sendIncompleteBookingEmail } from "./booking-email";

vi.mock("../../infrastructure/prisma/client", () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../infrastructure/queues", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe("booking-email utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send incomplete booking email successfully with therapist slug", async () => {
    const mockBooking = {
      id: "booking-1",
      startDateTime: new Date("2026-07-20T10:00:00.000Z"),
      client: {
        user: {
          firstName: "John",
          email: "john@example.com",
        },
      },
      therapist: {
        slug: "dr-jane-doe",
        user: {
          firstName: "Jane",
          lastName: "Doe",
        },
      },
    };

    (prisma.booking.findUnique as any).mockResolvedValue(mockBooking);

    await sendIncompleteBookingEmail("booking-1");

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    expect(emailQueue.add).toHaveBeenCalledWith("clientBookingIncomplete", {
      to: "john@example.com",
      subject: "Complete Your Booking with Jane Doe - CatalystCare",
      html: expect.stringContaining("John"),
      sender: { name: "CatalystCare", email: "info@catalystcare.in" },
    });

    // Check html content details
    const addCalls = (emailQueue.add as any).mock.calls[0][1];
    expect(addCalls.html).toContain("Hi John");
    expect(addCalls.html).toContain("Jane Doe");
    expect(addCalls.html).toContain("/therapists/dr-jane-doe");
    expect(addCalls.html).toContain("/therapists");
    expect(addCalls.html).toContain("Mon, 20 Jul, 2026");
    expect(addCalls.html).toContain("03:30 pm");
  });

  it("should fallback to therapist id if slug is missing", async () => {
    const mockBooking = {
      id: "booking-2",
      startDateTime: new Date("2026-07-20T10:00:00.000Z"),
      client: {
        user: {
          firstName: "John",
          email: "john@example.com",
        },
      },
      therapist: {
        id: "therapist-1",
        slug: null,
        user: {
          firstName: "Jane",
          lastName: "Doe",
        },
      },
    };

    (prisma.booking.findUnique as any).mockResolvedValue(mockBooking);

    await sendIncompleteBookingEmail("booking-2");

    const addCalls = (emailQueue.add as any).mock.calls[0][1];
    expect(addCalls.html).toContain("/therapists/therapist-1");
  });

  it("should skip if booking, client email, or therapist user is missing", async () => {
    (prisma.booking.findUnique as any).mockResolvedValue(null);

    await sendIncompleteBookingEmail("booking-3");

    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});

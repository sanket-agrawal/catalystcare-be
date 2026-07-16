import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("bullmq", () => {
  return {
    Worker: vi.fn().mockImplementation(() => {
      return {
        on: vi.fn(),
      };
    }),
    Queue: vi.fn().mockImplementation(() => {
      return {
        getJobSchedulers: vi.fn().mockResolvedValue([]),
        removeJobScheduler: vi.fn(),
        add: vi.fn(),
      };
    }),
  };
});

import { prisma } from "../prisma/client";
import { emailQueue } from "../queues/index";
import { addMinutes } from "date-fns";
import { checkSessionReminders } from "./sessionReminder.worker";

vi.mock("../prisma/client", () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../queues/index", () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
  reminderQueue: {
    getJobSchedulers: vi.fn().mockResolvedValue([]),
    removeJobScheduler: vi.fn(),
    add: vi.fn(),
  },
}));

vi.mock("../../shared/config/email.config", () => ({
  emailFromAddress: vi.fn(() => ({ infoEmail: "info@catalystcare.com" })),
}));

describe("sessionReminderWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should queue emails and update reminderSent for confirmed upcoming bookings", async () => {
    const startDateTime = addMinutes(new Date(), 15);
    const mockBookings = [
      {
        id: "booking-1",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        startDateTime,
        client: {
          user: {
            email: "client@example.com",
            firstName: "John",
            lastName: "Doe",
          },
        },
        therapist: {
          user: {
            email: "therapist@example.com",
            firstName: "Riya",
            lastName: "Singhal",
          },
        },
      },
    ];

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

    const mockJob = { name: "send_session_reminders", data: {} } as any;
    const result = await checkSessionReminders(mockJob);

    expect(result).toEqual({ remindersSent: 1 });
    expect(emailQueue.add).toHaveBeenCalledTimes(2);

    expect(emailQueue.add).toHaveBeenNthCalledWith(
      1,
      "sendSessionReminderClient",
      expect.objectContaining({
        to: "client@example.com",
        subject: "Reminder: Your session with Riya Singhal starts in 15 mins",
        sender: "info@catalystcare.com",
      })
    );

    expect(emailQueue.add).toHaveBeenNthCalledWith(
      2,
      "sendSessionReminderTherapist",
      expect.objectContaining({
        to: "therapist@example.com",
        subject: "Reminder: Your session with John Doe starts in 15 mins",
        sender: "info@catalystcare.com",
      })
    );

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { reminderSent: true },
    });
  });

  it("should skip booking if meeting link is missing", async () => {
    const startDateTime = addMinutes(new Date(), 15);
    const mockBookings = [
      {
        id: "booking-1",
        meetingLink: null,
        startDateTime,
        client: {
          user: {
            email: "client@example.com",
            firstName: "John",
            lastName: "Doe",
          },
        },
        therapist: {
          user: {
            email: "therapist@example.com",
            firstName: "Riya",
            lastName: "Singhal",
          },
        },
      },
    ];

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

    const mockJob = { name: "send_session_reminders", data: {} } as any;
    const result = await checkSessionReminders(mockJob);

    expect(result).toEqual({ remindersSent: 0 });
    expect(emailQueue.add).not.toHaveBeenCalled();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});

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
import { subDays } from "date-fns";
import {
  checkInactiveDistress,
  checkWeeklyRetention,
  checkDailyInactiveAndNonRepeat,
} from "./wellness.worker";

vi.mock("../prisma/client", () => ({
  prisma: {
    userVentMemory: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    ventSession: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    clientProfile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../queues/index", () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
  wellnessQueue: {
    getJobSchedulers: vi.fn().mockResolvedValue([]),
    removeJobScheduler: vi.fn(),
    add: vi.fn(),
  },
}));

vi.mock("../../shared/config/email.config", () => ({
  emailFromAddress: vi.fn(() => ({ infoEmail: "info@catalystcare.com" })),
}));

describe("wellnessWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should queue email and update sent date for inactive CLIENT with low EMA", async () => {
    const mockMemories = [
      { id: "mem-1", userId: "user-1", currentEma: -0.5, therapyEmailSentAt: null },
    ];
    vi.mocked(prisma.userVentMemory.findMany).mockResolvedValue(mockMemories as any);

    // Latest session 15 days ago (inactive)
    const fifteenDaysAgo = subDays(new Date(), 15);
    vi.mocked(prisma.ventSession.findFirst).mockResolvedValue({
      lastActiveAt: fifteenDaysAgo,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "user@example.com",
      firstName: "Test",
      role: "CLIENT",
    } as any);

    const mockJob = { name: "check_inactive_distress", data: {} } as any;
    const result = await checkInactiveDistress(mockJob);

    expect(result).toEqual({ emailsQueued: 1 });
    expect(emailQueue.add).toHaveBeenCalledWith(
      "sendProactiveCheckInEmail",
      expect.objectContaining({
        to: "user@example.com",
        subject: "Checking In on You - CatalystCare Support",
        html: expect.stringContaining("Connect with a Therapist"),
        sender: "info@catalystcare.com",
      })
    );
    expect(prisma.userVentMemory.update).toHaveBeenCalledWith({
      where: { id: "mem-1" },
      data: { therapyEmailSentAt: expect.any(Date) },
    });
  });

  it("should queue professional email and update sent date for inactive THERAPIST with low EMA", async () => {
    const mockMemories = [
      { id: "mem-1", userId: "user-1", currentEma: -0.5, therapyEmailSentAt: null },
    ];
    vi.mocked(prisma.userVentMemory.findMany).mockResolvedValue(mockMemories as any);

    // Latest session 15 days ago (inactive)
    const fifteenDaysAgo = subDays(new Date(), 15);
    vi.mocked(prisma.ventSession.findFirst).mockResolvedValue({
      lastActiveAt: fifteenDaysAgo,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "therapist@example.com",
      firstName: "Dr. Test",
      role: "THERAPIST",
    } as any);

    const mockJob = { name: "check_inactive_distress", data: {} } as any;
    const result = await checkInactiveDistress(mockJob);

    expect(result).toEqual({ emailsQueued: 1 });
    expect(emailQueue.add).toHaveBeenCalledWith(
      "sendProactiveCheckInEmail",
      expect.objectContaining({
        to: "therapist@example.com",
        subject: "Checking In on You - CatalystCare Wellness",
        html: expect.stringContaining("Explore Wellness Tools"),
        sender: "info@catalystcare.com",
      })
    );
    expect(prisma.userVentMemory.update).toHaveBeenCalledWith({
      where: { id: "mem-1" },
      data: { therapyEmailSentAt: expect.any(Date) },
    });
  });

  it("should skip user if they vented recently", async () => {
    const mockMemories = [
      { id: "mem-1", userId: "user-1", currentEma: -0.5, therapyEmailSentAt: null },
    ];
    vi.mocked(prisma.userVentMemory.findMany).mockResolvedValue(mockMemories as any);

    // Latest session 5 days ago (active)
    const fiveDaysAgo = subDays(new Date(), 5);
    vi.mocked(prisma.ventSession.findFirst).mockResolvedValue({
      lastActiveAt: fiveDaysAgo,
    } as any);

    const mockJob = { name: "check_inactive_distress", data: {} } as any;
    const result = await checkInactiveDistress(mockJob);

    expect(result).toEqual({ emailsQueued: 0 });
    expect(emailQueue.add).not.toHaveBeenCalled();
    expect(prisma.userVentMemory.update).not.toHaveBeenCalled();
  });

  it("should respect 7-day cooldown filters in database query", async () => {
    vi.mocked(prisma.userVentMemory.findMany).mockResolvedValue([]);

    const mockJob = { name: "check_inactive_distress", data: {} } as any;
    await checkInactiveDistress(mockJob);

    expect(prisma.userVentMemory.findMany).toHaveBeenCalledWith({
      where: {
        currentEma: { lte: -0.4 },
        OR: [{ therapyEmailSentAt: null }, { therapyEmailSentAt: { lt: expect.any(Date) } }],
      },
    });
  });

  describe("checkWeeklyRetention", () => {
    it("should queue weekly retention email for client who booked last week but has no upcoming booking", async () => {
      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce([{ clientId: "client-1" }] as any)
        .mockResolvedValueOnce([] as any);

      vi.mocked(prisma.clientProfile.findUnique).mockResolvedValue({
        id: "client-1",
        user: {
          email: "client@example.com",
          firstName: "Alice",
        },
      } as any);

      const mockJob = { name: "check_weekly_retention", data: {} } as any;
      const result = await checkWeeklyRetention(mockJob);

      expect(result).toEqual({ emailsQueued: 1 });
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendWeeklyRetentionEmail",
        expect.objectContaining({
          to: "client@example.com",
          subject: "Checking In on Your Well-being - CatalystCare",
          html: expect.stringContaining("Alice"),
          sender: "info@catalystcare.com",
        })
      );
    });

    it("should skip client if they have an upcoming booking", async () => {
      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce([{ clientId: "client-1" }] as any)
        .mockResolvedValueOnce([{ clientId: "client-1" }] as any);

      const mockJob = { name: "check_weekly_retention", data: {} } as any;
      const result = await checkWeeklyRetention(mockJob);

      expect(result).toEqual({ emailsQueued: 0 });
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it("should do nothing if no clients had a session in the last 7 days", async () => {
      vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([]);

      const mockJob = { name: "check_weekly_retention", data: {} } as any;
      const result = await checkWeeklyRetention(mockJob);

      expect(result).toEqual({ emailsQueued: 0 });
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("checkDailyInactiveAndNonRepeat", () => {
    it("should queue email for one-time booking clients who didn't repeat after 14 days", async () => {
      vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([{ clientId: "client-1" }] as any);

      vi.mocked(prisma.booking.count).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      vi.mocked(prisma.clientProfile.findUnique).mockResolvedValue({
        id: "client-1",
        user: {
          email: "client1@example.com",
          firstName: "Alice",
        },
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

      const mockJob = { name: "check_daily_inactive_and_non_repeat", data: {} } as any;
      const result = await checkDailyInactiveAndNonRepeat(mockJob);

      expect(result).toEqual({ emailsQueued: 1 });
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendNonRepeatClientEmail",
        expect.objectContaining({
          to: "client1@example.com",
          subject: "Continue Your Wellness Journey - CatalystCare",
          html: expect.stringContaining("Alice"),
        })
      );
    });

    it("should queue email for inactive clients after 30 days", async () => {
      vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        {
          email: "inactive@example.com",
          firstName: "Bob",
        },
      ] as any);

      const mockJob = { name: "check_daily_inactive_and_non_repeat", data: {} } as any;
      const result = await checkDailyInactiveAndNonRepeat(mockJob);

      expect(result).toEqual({ emailsQueued: 1 });
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendInactiveClientEmail",
        expect.objectContaining({
          to: "inactive@example.com",
          subject: "We'd Love to Help You Get Started - CatalystCare",
          html: expect.stringContaining("Bob"),
        })
      );
    });
  });
});

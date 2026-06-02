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
import { checkInactiveDistress } from "./wellness.worker";

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

  it("should queue email and update sent date for inactive user with low EMA", async () => {
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
    } as any);

    const mockJob = { name: "check_inactive_distress", data: {} } as any;
    const result = await checkInactiveDistress(mockJob);

    expect(result).toEqual({ emailsQueued: 1 });
    expect(emailQueue.add).toHaveBeenCalledWith(
      "sendProactiveCheckInEmail",
      expect.objectContaining({
        to: "user@example.com",
        subject: "Checking In on You - CatalystCare Support",
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
});

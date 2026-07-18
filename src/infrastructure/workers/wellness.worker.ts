import { Worker } from "bullmq";
import { redisConnection } from "../redis/index";
import { prisma } from "../prisma/client";
import { emailQueue } from "../queues/index";
import { emailFromAddress } from "../../shared/config/email.config";
import {
  proactiveCheckInTemplate,
  professionalProactiveCheckInTemplate,
  weeklyBookingRetentionTemplate,
  nonRepeatClientTemplate,
  inactiveClientTemplate,
} from "../../shared/email-templates/wellness";
import { subDays } from "date-fns";

export async function checkInactiveDistress(job: any) {
  if (job.name === "check_inactive_distress") {
    console.log("[wellnessWorker] Starting inactive user distress check...");

    const fourteenDaysAgo = subDays(new Date(), 14);
    const sevenDaysAgo = subDays(new Date(), 7);

    // 1. Fetch memories with low EMA and whose cooldown has passed (or never sent)
    const memories = await prisma.userVentMemory.findMany({
      where: {
        currentEma: { lte: -0.4 },
        OR: [{ therapyEmailSentAt: null }, { therapyEmailSentAt: { lt: sevenDaysAgo } }],
      },
    });

    console.log(`[wellnessWorker] Found ${memories.length} distress memory candidates`);

    let emailsQueued = 0;

    for (const memory of memories) {
      // 2. Fetch the user's latest active session activity
      const latestSession = await prisma.ventSession.findFirst({
        where: {
          userId: memory.userId,
          isActive: true,
        },
        orderBy: {
          lastActiveAt: "desc",
        },
        select: {
          lastActiveAt: true,
        },
      });

      // If the user has never vented or vented in the last 14 days, skip
      if (!latestSession || latestSession.lastActiveAt >= fourteenDaysAgo) {
        continue;
      }

      // 3. Retrieve user email, name, and role
      const user = await prisma.user.findUnique({
        where: { id: memory.userId },
        select: { email: true, firstName: true, role: true },
      });

      if (user && user.email) {
        const isConsumer = ["CLIENT", "EMPLOYEE", "STUDENT"].includes(user.role);
        const htmlContent = isConsumer
          ? proactiveCheckInTemplate(user.firstName || "there")
          : professionalProactiveCheckInTemplate(user.firstName || "there");
        const emailSubject = isConsumer
          ? "Checking In on You - CatalystCare Support"
          : "Checking In on You - CatalystCare Wellness";

        // 4. Queue the check-in email to emailQueue
        await emailQueue.add("sendProactiveCheckInEmail", {
          to: user.email,
          subject: emailSubject,
          html: htmlContent,
          sender: emailFromAddress().infoEmail,
        });

        // 5. Update the cooldown timestamp
        await prisma.userVentMemory.update({
          where: { id: memory.id },
          data: { therapyEmailSentAt: new Date() },
        });

        emailsQueued++;
      }
    }

    console.log(`[wellnessWorker] Inactive user checks complete. Queued ${emailsQueued} email(s)`);
    return { emailsQueued };
  }

  return null;
}

export async function checkWeeklyRetention(job: any) {
  if (job.name === "check_weekly_retention") {
    console.log("[wellnessWorker] Starting weekly client booking retention check...");

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    // 1. Find all bookings that were confirmed/completed in the last 7 days
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startDateTime: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
      select: {
        clientId: true,
      },
    });

    const clientIdsWhoHadRecentSession = Array.from(new Set(recentBookings.map((b) => b.clientId)));

    if (clientIdsWhoHadRecentSession.length === 0) {
      console.log("[wellnessWorker] No clients had a recent session in the last 7 days.");
      return { emailsQueued: 0 };
    }

    // 2. Find which of these clients have already booked a session for next week
    const futureBookings = await prisma.booking.findMany({
      where: {
        clientId: { in: clientIdsWhoHadRecentSession },
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        startDateTime: {
          gt: now,
        },
      },
      select: {
        clientId: true,
      },
    });

    const clientIdsWithFutureSession = new Set(futureBookings.map((b) => b.clientId));

    // 3. Filter down to clients who have NOT booked a future session
    const targetClientIds = clientIdsWhoHadRecentSession.filter(
      (id) => !clientIdsWithFutureSession.has(id)
    );

    console.log(
      `[wellnessWorker] Found ${targetClientIds.length} client(s) with no upcoming bookings.`
    );

    let emailsQueued = 0;

    for (const clientId of targetClientIds) {
      const client = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      if (client && client.user && client.user.email) {
        await emailQueue.add("sendWeeklyRetentionEmail", {
          to: client.user.email,
          subject: "Checking In on Your Well-being - CatalystCare",
          html: weeklyBookingRetentionTemplate(client.user.firstName || "there"),
          sender: emailFromAddress().infoEmail,
        });

        emailsQueued++;
      }
    }

    console.log(
      `[wellnessWorker] Weekly booking retention checks complete. Queued ${emailsQueued} email(s)`
    );
    return { emailsQueued };
  }
  return null;
}

export async function checkDailyInactiveAndNonRepeat(job: any) {
  if (job.name === "check_daily_inactive_and_non_repeat") {
    console.log("[wellnessWorker] Starting daily inactive and non-repeat check...");

    const now = new Date();

    // 14 days threshold for non-repeating users (ended between 15 and 14 days ago)
    const fourteenDaysAgo = subDays(now, 14);
    const fifteenDaysAgo = subDays(now, 15);

    // 30 days threshold for inactive users (lastLogin between 31 and 30 days ago)
    const thirtyDaysAgo = subDays(now, 30);
    const thirtyOneDaysAgo = subDays(now, 31);

    let emailsQueued = 0;

    // --- PART 1: Non-repeating clients (exactly 1 completed/confirmed session in the past, ended 14 days ago) ---
    const candidates = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startDateTime: {
          gte: fifteenDaysAgo,
          lte: fourteenDaysAgo,
        },
      },
      select: {
        clientId: true,
      },
    });

    const candidateClientIds = Array.from(new Set(candidates.map((c) => c.clientId)));

    for (const clientId of candidateClientIds) {
      const bookingCount = await prisma.booking.count({
        where: {
          clientId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      });

      if (bookingCount === 1) {
        const futureCount = await prisma.booking.count({
          where: {
            clientId,
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            startDateTime: {
              gt: now,
            },
          },
        });

        if (futureCount === 0) {
          const client = await prisma.clientProfile.findUnique({
            where: { id: clientId },
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                },
              },
            },
          });

          if (client && client.user && client.user.email) {
            await emailQueue.add("sendNonRepeatClientEmail", {
              to: client.user.email,
              subject: "Continue Your Wellness Journey - CatalystCare",
              html: nonRepeatClientTemplate(client.user.firstName || "there"),
              sender: emailFromAddress().infoEmail,
            });
            emailsQueued++;
          }
        }
      }
    }

    // --- PART 2: Inactive clients (signed up / logged in 30 days ago, never booked) ---
    const inactiveUsers = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        lastLogin: {
          gte: thirtyOneDaysAgo,
          lte: thirtyDaysAgo,
        },
        clientProfile: {
          bookings: {
            none: {},
          },
        },
      },
      select: {
        email: true,
        firstName: true,
      },
    });

    for (const user of inactiveUsers) {
      if (user.email) {
        await emailQueue.add("sendInactiveClientEmail", {
          to: user.email,
          subject: "We'd Love to Help You Get Started - CatalystCare",
          html: inactiveClientTemplate(user.firstName || "there"),
          sender: emailFromAddress().infoEmail,
        });
        emailsQueued++;
      }
    }

    console.log(
      `[wellnessWorker] Daily inactive & non-repeat checks complete. Queued ${emailsQueued} email(s)`
    );
    return { emailsQueued };
  }
  return null;
}

export const wellnessWorker = new Worker(
  "wellness-queue",
  async (job) => {
    if (job.name === "check_inactive_distress") {
      return checkInactiveDistress(job);
    } else if (job.name === "check_weekly_retention") {
      return checkWeeklyRetention(job);
    } else if (job.name === "check_daily_inactive_and_non_repeat") {
      return checkDailyInactiveAndNonRepeat(job);
    }
    return null;
  },
  {
    connection: redisConnection,
  }
);

import { Worker } from "bullmq";
import { redisConnection } from "../redis/index";
import { prisma } from "../prisma/client";
import { emailQueue } from "../queues/index";
import { emailFromAddress } from "../../shared/config/email.config";
import { proactiveCheckInTemplate } from "../../shared/email-templates/wellness";
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

      // 3. Retrieve user email and name
      const user = await prisma.user.findUnique({
        where: { id: memory.userId },
        select: { email: true, firstName: true },
      });

      if (user && user.email) {
        // 4. Queue the check-in email to emailQueue
        await emailQueue.add("sendProactiveCheckInEmail", {
          to: user.email,
          subject: "Checking In on You - CatalystCare Support",
          html: proactiveCheckInTemplate(user.firstName || "there"),
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

export const wellnessWorker = new Worker("wellness-queue", checkInactiveDistress, {
  connection: redisConnection,
});

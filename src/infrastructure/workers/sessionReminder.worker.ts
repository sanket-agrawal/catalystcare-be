import { Worker } from "bullmq";
import { redisConnection } from "../redis/index";
import { prisma } from "../prisma/client";
import { emailQueue } from "../queues/index";
import { emailFromAddress } from "../../shared/config/email.config";
import {
  clientSessionReminderTemplate,
  therapistSessionReminderTemplate,
} from "../../shared/email-templates/booking";
import { addMinutes } from "date-fns";

export async function checkSessionReminders(job: any) {
  if (job.name === "send_session_reminders") {
    console.log("[sessionReminderWorker] Checking for upcoming sessions to send reminders...");

    const now = new Date();
    const sixteenMinutesFromNow = addMinutes(now, 16);

    // Find bookings that start in the next 16 minutes, are confirmed, active, and haven't had reminder sent
    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        isActive: true,
        reminderSent: false,
        startDateTime: {
          gte: now,
          lte: sixteenMinutesFromNow,
        },
      },
      include: {
        client: {
          include: { user: true },
        },
        therapist: {
          include: { user: true },
        },
      },
    });

    console.log(`[sessionReminderWorker] Found ${bookings.length} session(s) requiring reminders.`);

    let remindersSent = 0;

    for (const booking of bookings) {
      const meetLink = booking.meetingLink;
      if (!meetLink) {
        console.warn(
          `[sessionReminderWorker] Booking ${booking.id} has no meeting link. Skipping reminder.`
        );
        continue;
      }

      const clientEmail = booking.client.user.email;
      const clientFirstName = booking.client.user.firstName;
      const therapistEmail = booking.therapist.user.email;
      const therapistFirstName = booking.therapist.user.firstName;
      const therapistFullName = `${therapistFirstName} ${booking.therapist.user.lastName}`;
      const clientFullName = `${clientFirstName} ${booking.client.user.lastName}`;

      const sessionTime = booking.startDateTime.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      });

      // 1. Queue client reminder email
      if (clientEmail) {
        await emailQueue.add("sendSessionReminderClient", {
          to: clientEmail,
          subject: `Reminder: Your session with ${therapistFullName} starts in 15 mins`,
          html: clientSessionReminderTemplate(
            clientFirstName,
            therapistFullName,
            sessionTime,
            meetLink
          ),
          sender: emailFromAddress().infoEmail,
        });
      }

      // 2. Queue therapist reminder email
      if (therapistEmail) {
        await emailQueue.add("sendSessionReminderTherapist", {
          to: therapistEmail,
          subject: `Reminder: Your session with ${clientFullName} starts in 15 mins`,
          html: therapistSessionReminderTemplate(
            therapistFirstName,
            clientFullName,
            sessionTime,
            meetLink
          ),
          sender: emailFromAddress().infoEmail,
        });
      }

      // 3. Mark reminderSent as true
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });

      remindersSent++;
      console.log(`[sessionReminderWorker] Session reminders queued for booking: ${booking.id}`);
    }

    return { remindersSent };
  }

  return null;
}

export const sessionReminderWorker = new Worker("reminder-queue", checkSessionReminders, {
  connection: redisConnection,
});

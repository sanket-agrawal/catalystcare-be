import { slotQueue, wellnessQueue, reminderQueue } from "../queues/index";
import { Job } from "bullmq";

// Run daily repeatable jobs
export async function registerRepeatableJobs() {
  console.log("⏳ Registering repeatable BullMQ jobs...");

  // 1. Slot Regeneration repeatable job (midnight IST)
  const existingSlots = await slotQueue.getJobSchedulers();
  for (const job of existingSlots) {
    await slotQueue.removeJobScheduler(job.key);
  }

  await slotQueue.add(
    "regenerate_future_slots",
    {},
    {
      repeat: {
        pattern: "0 0 * * *",
        tz: "Asia/Kolkata",
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );
  console.log("Registered repeatable job: regenerate_future_slots");

  // 2. Wellness Proactive Distress check repeatable job (10:00 AM IST daily)
  const existingWellness = await wellnessQueue.getJobSchedulers();
  for (const job of existingWellness) {
    await wellnessQueue.removeJobScheduler(job.key);
  }

  await wellnessQueue.add(
    "check_inactive_distress",
    {},
    {
      repeat: {
        pattern: "0 10 * * *",
        tz: "Asia/Kolkata",
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );
  console.log("Registered repeatable job: check_inactive_distress (10:00 AM IST)");

  // 3. Session 15-min reminder repeatable job (every minute)
  const existingReminders = await reminderQueue.getJobSchedulers();
  for (const job of existingReminders) {
    await reminderQueue.removeJobScheduler(job.key);
  }

  await reminderQueue.add(
    "send_session_reminders",
    {},
    {
      repeat: {
        pattern: "* * * * *", // every minute
        tz: "Asia/Kolkata",
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
  console.log("Registered repeatable job: send_session_reminders (every minute)");
}

import { slotQueue } from "../queues/index";
import { Job } from "bullmq";

// Run daily at midnight IST (Asia/Kolkata)
export async function registerRepeatableJobs() {

    console.log("⏳ Registering repeatable BullMQ jobs...");

  // Remove old repeatable job definitions (optional safety)
  const existing = await slotQueue.getJobSchedulers();
  for (const job of existing) {
    await slotQueue.removeJobScheduler(job.key);
  }

  await slotQueue.add(
    "regenerate_future_slots",
    {},
    {
      repeat: {
        pattern: "0 0 * * *",
        tz: "Asia/Kolkata"
    },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );

  console.log("Registered repeatable job: regenerate_future_slots");
}

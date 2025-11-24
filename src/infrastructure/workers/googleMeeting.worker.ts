import { Worker } from "bullmq";
import { createGoogleMeetForBooking } from "../google/meetingGeneration.service";
import { CreateMeetingJobData } from "../queues/index";
import { redisConnection } from "../redis/index";
const queueName = "google-meeting-queue";

export const meetingWorker = new Worker<CreateMeetingJobData>(
  queueName,
  async (job) => {
    try {
      await createGoogleMeetForBooking(job.data);
    } catch (error) {
      console.error(
        `[meetingWorker] Failed for booking ${job.data.bookingId}`,
        error
      );
      throw error;
    }
  },
  {
    connection : redisConnection,
  }
);

// Optional: start logging
meetingWorker.on("completed", (job) => {
  console.log(`[meetingWorker] Job completed: ${job.id}`);
});

meetingWorker.on("failed", (job, err) => {
  console.error(`[meetingWorker] Job failed: ${job?.id}`, err);
});

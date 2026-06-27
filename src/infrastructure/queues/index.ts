import { Queue, RedisConnection } from "bullmq";
import { redisConnection } from "../redis/index";

//email sending queue
export const emailQueue = new Queue("emailQueue", { connection: redisConnection });

//booking cleanup queue
export const bookingCleanupQueue = new Queue("bookingCleanupQueue", {
  connection: redisConnection,
});

//slot generation queue
export const slotQueue = new Queue("slot-queue", { connection: redisConnection });

export interface CreateMeetingJobData {
  bookingId: string;
  programTitle?: string;
  planName?: string;
  sessionNumber?: number;
}

// meeting generation queue
export const meetingQueue = new Queue<CreateMeetingJobData>("google-meeting-queue", {
  connection: redisConnection,
});

export const emailBlastQueue = new Queue("email-blast-queue", {
  connection: redisConnection,
});

export const programSlotBookingMeetingQueue = new Queue("program-slot-google-meeting-queue", {
  connection: redisConnection,
});

export const wellnessQueue = new Queue("wellness-queue", {
  connection: redisConnection,
});

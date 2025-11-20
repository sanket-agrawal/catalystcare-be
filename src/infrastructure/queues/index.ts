import { Queue, RedisConnection } from 'bullmq';
import { redisConnection } from '../redis/index';

//email sending queue
export const emailQueue = new Queue('emailQueue', { connection: redisConnection });

//booking cleanup queue
export const bookingCleanupQueue = new Queue("bookingCleanupQueue", {
  connection: redisConnection,
});

//slot generation queue
export const slotQueue = new Queue("slot-queue", { connection : redisConnection });
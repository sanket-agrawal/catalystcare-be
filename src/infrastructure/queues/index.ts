import { Queue } from 'bullmq';
import { redisConnection } from '../redis/index';

//email sending queue
export const emailQueue = new Queue('emailQueue', { connection: redisConnection });

//booking cleanup queue
export const bookingCleanupQueue = new Queue("bookingCleanupQueue", {
  connection: redisConnection,
});

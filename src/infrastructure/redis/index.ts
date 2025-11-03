import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,  // required by BullMQ
  enableReadyCheck: false,     // optional but recommended
});

redisConnection.on('connect', () => console.log('🔗 Connected to Redis'));
redisConnection.on('error', err => console.error('❌ Redis error:', err));

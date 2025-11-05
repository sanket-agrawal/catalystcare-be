import IORedis from 'ioredis';
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,  
  enableReadyCheck: false,   
});

redisConnection.on('connect', () => console.log('🔗 Connected to Redis'));
redisConnection.on('error', err => console.error('❌ Redis error:', err));

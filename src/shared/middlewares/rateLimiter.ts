import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisConnection } from "../../infrastructure/redis";
import { rateLimitConfig } from "../config/rateLimit.config";
import ApiResponse from "../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";

// Reusable handler to return uniform error responses matching current API patterns
const limitReachedHandler = (req: Request, res: Response, next: NextFunction, options: any) => {
  res.status(options.statusCode).json(new ApiResponse(false, options.statusCode, options.message));
};

// General Rate Limiter (configured via global config)
export const globalLimiter = rateLimit({
  windowMs: rateLimitConfig.global.windowMs,
  limit: () => rateLimitConfig.global.limit,
  message: rateLimitConfig.global.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReachedHandler,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redisConnection.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: "rl:global:",
  }),
});

// Authentication Rate Limiter
export const authLimiter = rateLimit({
  windowMs: rateLimitConfig.auth.windowMs,
  limit: () => rateLimitConfig.auth.limit,
  message: rateLimitConfig.auth.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReachedHandler,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redisConnection.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: "rl:auth:",
  }),
});

// AI Service Rate Limiter
export const aiLimiter = rateLimit({
  windowMs: rateLimitConfig.ai.windowMs,
  limit: () => rateLimitConfig.ai.limit,
  message: rateLimitConfig.ai.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReachedHandler,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redisConnection.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: "rl:ai:",
  }),
});

// File Upload Rate Limiter
export const uploadLimiter = rateLimit({
  windowMs: rateLimitConfig.upload.windowMs,
  limit: () => rateLimitConfig.upload.limit,
  message: rateLimitConfig.upload.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReachedHandler,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redisConnection.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: "rl:upload:",
  }),
});

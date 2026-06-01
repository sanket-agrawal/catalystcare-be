import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Define a mock store that can be cleared between tests
const mockStoreData: Record<string, { totalHits: number; resetTime: Date }> = {};

// Mock rate-limit-redis to run tests without a live Redis server
vi.mock("rate-limit-redis", () => {
  return {
    RedisStore: vi.fn().mockImplementation(() => {
      return {
        increment: vi.fn().mockImplementation(async (key: string) => {
          if (!mockStoreData[key]) {
            mockStoreData[key] = {
              totalHits: 0,
              resetTime: new Date(Date.now() + 15 * 60 * 1000),
            };
          }
          mockStoreData[key].totalHits += 1;
          return {
            totalHits: mockStoreData[key].totalHits,
            resetTime: mockStoreData[key].resetTime,
          };
        }),
        decrement: vi.fn().mockImplementation(async (key: string) => {
          if (mockStoreData[key]) {
            mockStoreData[key].totalHits = Math.max(0, mockStoreData[key].totalHits - 1);
          }
        }),
        resetKey: vi.fn().mockImplementation(async (key: string) => {
          delete mockStoreData[key];
        }),
      };
    }),
  };
});

import { rateLimitConfig } from "../config/rateLimit.config";
import { globalLimiter, authLimiter } from "./rateLimiter";

describe("Rate Limiter Middleware", () => {
  let originalConfig: typeof rateLimitConfig;

  beforeEach(() => {
    // Clear mock store data between tests
    for (const key in mockStoreData) {
      delete mockStoreData[key];
    }

    originalConfig = JSON.parse(JSON.stringify(rateLimitConfig));
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore configuration
    Object.assign(rateLimitConfig, originalConfig);
  });

  it("should allow requests within limits and add rate limit headers", async () => {
    // Set a small limit for testing
    rateLimitConfig.global.limit = 5;

    const app = express();
    app.set("trust proxy", 1);
    app.use(globalLimiter);
    app.get("/test", (req, res) => {
      res.status(200).json({ message: "OK" });
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "OK" });
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
    expect(res.headers["ratelimit-limit"]).toBe("5");
    expect(res.headers["ratelimit-remaining"]).toBe("4");
  });

  it("should return 429 and block requests when the limit is exceeded", async () => {
    // Set limit to 2 for fast testing
    rateLimitConfig.global.limit = 2;

    const app = express();
    app.set("trust proxy", 1);
    app.use(globalLimiter);
    app.get("/test", (req, res) => {
      res.status(200).json({ message: "OK" });
    });

    // Request 1
    const res1 = await request(app).get("/test");
    expect(res1.status).toBe(200);

    // Request 2
    const res2 = await request(app).get("/test");
    expect(res2.status).toBe(200);

    // Request 3 (Exceeds limit)
    const res3 = await request(app).get("/test");
    expect(res3.status).toBe(429);
    expect(res3.body).toEqual({
      success: false,
      statusCode: 429,
      message: rateLimitConfig.global.message,
    });
    expect(res3.headers).toHaveProperty("retry-after");
  });

  it("should apply stricter limits for the auth limiter", async () => {
    rateLimitConfig.auth.limit = 1;

    const app = express();
    app.set("trust proxy", 1);
    app.use(authLimiter);
    app.post("/login", (req, res) => {
      res.status(200).json({ success: true });
    });

    const res1 = await request(app).post("/login");
    expect(res1.status).toBe(200);

    const res2 = await request(app).post("/login");
    expect(res2.status).toBe(429);
    expect(res2.body).toEqual({
      success: false,
      statusCode: 429,
      message: rateLimitConfig.auth.message,
    });
  });
});

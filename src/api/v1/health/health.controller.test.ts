import { describe, expect, it, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { healthController } from "./health.controller";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { prisma } from "../../../infrastructure/prisma/client";
import { redisConnection } from "../../../infrastructure/redis";

// Mock ApiResponse
vi.mock("../../../shared/utils/ApiResponse");

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("../../../infrastructure/redis", () => ({
  redisConnection: {
    ping: vi.fn(),
  },
}));

describe("Health Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkHealth", () => {
    it("should return health status successfully when db and redis are ok", async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);
      vi.mocked(redisConnection.ping).mockResolvedValueOnce("PONG");

      // Mock process.uptime()
      const originalUptime = process.uptime;
      process.uptime = vi.fn().mockReturnValue(123.456);

      // Mock Date.now()
      const originalNow = Date.now;
      Date.now = vi.fn().mockReturnValue(1640995200000);

      // Mock memoryUsage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      } as any);

      await healthController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Health Check Performed Successfully",
        expect.objectContaining({
          status: "Healthy",
          server: "ok",
          database: "ok",
          redis: "ok",
          uptime: 123,
          upTime: 123.456,
          timeStamp: 1640995200000,
          memory: {
            rss: "100 MB",
            heapUsed: "50 MB",
            heapTotal: "80 MB",
          },
        })
      );

      // Restore originals
      process.uptime = originalUptime;
      Date.now = originalNow;
      process.memoryUsage = originalMemoryUsage;
    });

    it("should return 503 Degraded when database check fails", async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("DB Down"));
      vi.mocked(redisConnection.ping).mockResolvedValueOnce("PONG");

      await healthController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        503,
        "Health Check Failed",
        expect.objectContaining({
          status: "Degraded",
          server: "ok",
          database: "error",
          redis: "ok",
        })
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockImplementation(() => {
        throw new Error("Memory error");
      });

      await healthController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(false, 500, "Memory error");

      process.memoryUsage = originalMemoryUsage;
    });
  });
});

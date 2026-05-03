import { describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import { healthController } from "./health.controller";
import ApiResponse from "../../../shared/utils/ApiResponse";

// Mock ApiResponse
vi.mock("../../../shared/utils/ApiResponse");

describe("Health Controller", () => {
  describe("checkHealth", () => {
    it("should return health status successfully", async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock process.uptime()
      const originalUptime = process.uptime;
      process.uptime = vi.fn().mockReturnValue(123.456);

      // Mock Date.now()
      const originalNow = Date.now;
      Date.now = vi.fn().mockReturnValue(1640995200000); // 2022-01-01 00:00:00 UTC

      await healthController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Health Check Performed Successfully",
        {
          status: "Healthy",
          upTime: 123.456,
          timeStamp: 1640995200000,
        }
      );

      // Restore originals
      process.uptime = originalUptime;
      Date.now = originalNow;
    });

    it("should handle errors gracefully", async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock process.uptime to throw error
      const originalUptime = process.uptime;
      process.uptime = vi.fn().mockImplementation(() => {
        throw new Error("Uptime error");
      });

      await healthController.checkHealth(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(false, 500, "Uptime error");

      // Restore original
      process.uptime = originalUptime;
    });
  });
});

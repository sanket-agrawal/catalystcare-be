import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { prisma } from "../../../infrastructure/prisma/client";
import { redisConnection } from "../../../infrastructure/redis";

export const healthController = {
  async checkHealth(req: Request, res: Response) {
    try {
      const memUsage = process.memoryUsage();
      const checks: Record<string, any> = {
        server: "ok",
        database: "checking",
        redis: "checking",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        },
      };

      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = "ok";
      } catch {
        checks.database = "error";
      }

      try {
        await redisConnection.ping();
        checks.redis = "ok";
      } catch {
        checks.redis = "error";
      }

      const allOk = checks.database === "ok" && checks.redis === "ok";
      const statusCode = allOk ? 200 : 503;

      const responseData = {
        status: allOk ? "Healthy" : "Degraded",
        upTime: process.uptime(),
        timeStamp: Date.now(),
        ...checks,
      };

      return res
        .status(statusCode)
        .json(
          new ApiResponse(
            allOk,
            statusCode,
            allOk ? "Health Check Performed Successfully" : "Health Check Failed",
            responseData
          )
        );
    } catch (error) {
      return res.status(500).json(new ApiResponse(false, 500, (error as Error).message));
    }
  },
};

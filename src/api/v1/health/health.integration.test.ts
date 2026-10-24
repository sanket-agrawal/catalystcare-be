import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Server } from "http";

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

import healthRoutes from "./health.routes";

/**
 * Lightweight app: only health routes — no Redis, MongoDB, or BullMQ (safe for pre-docker CI).
 */
function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/health", healthRoutes);
  return app;
}

describe("Health API integration", () => {
  const app = buildTestApp();
  let server: Server;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe("GET /api/v1/health", () => {
    it("returns health payload", async () => {
      const response = await request(app).get("/api/v1/health").expect(200);

      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        message: "Health Check Performed Successfully",
        data: {
          status: "Healthy",
          server: "ok",
          database: "ok",
          redis: "ok",
        },
      });
      expect(typeof response.body.data.upTime).toBe("number");
      expect(typeof response.body.data.uptime).toBe("number");
      expect(typeof response.body.data.timeStamp).toBe("number");
      expect(typeof response.body.data.timestamp).toBe("string");
      expect(response.body.data.memory).toMatchObject({
        rss: expect.stringMatching(/\d+ MB/),
        heapUsed: expect.stringMatching(/\d+ MB/),
        heapTotal: expect.stringMatching(/\d+ MB/),
      });
    });
  });
});

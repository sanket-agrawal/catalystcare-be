import { Router } from "express";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { VentController } from "./text.controller";
import { VentContextService } from "./text.service";
import { VentLLMService } from "./text.llm.service";
import { VentPersistenceService } from "./text.persistence";
// import { createRedisRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from '../../../../../shared/middlewares/authenticatation';

export function createVentRouter(redis: Redis, prisma: PrismaClient): Router {
  const router = Router();

  const persistenceService = new VentPersistenceService(prisma);
  const contextService = new VentContextService(redis, persistenceService);
  const llmService = new VentLLMService();
  const controller = new VentController(contextService, llmService, persistenceService);

//   const ventRateLimiter = createRedisRateLimiter(redis, {
//     windowSeconds: 60,
//     maxRequests: 30,
//     keyPrefix: "vent:text",
//   });

  router.use(authenticate);
  router.post("/message", controller.ventText);
  router.delete("/session/:sessionId", controller.clearSession);

  return router;
}

// Mount in app.ts:
// app.use("/api/v1/extension/vent", createVentRouter(redisClient, prisma));
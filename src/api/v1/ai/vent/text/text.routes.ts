import { Router } from "express";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { VentController } from "./text.controller";
import { VentContextService } from "./text.service";
import { VentLLMService } from "./text.llm.service";
import { VentPersistenceService } from "./text.persistence";
import { authenticate } from "../../../../../shared/middlewares/authenticatation";

export function createVentRouter(redis: Redis, prisma: PrismaClient): Router {
  const router = Router();

  const persistenceService = new VentPersistenceService(prisma);
  const contextService = new VentContextService(redis, persistenceService);
  const llmService = new VentLLMService();
  const controller = new VentController(contextService, llmService, persistenceService);

  // router.use(authenticate);

  // Session management
  router.post("/sessions", controller.createSession); // create new chat
  router.get("/sessions", controller.getSessions); // list all chats
  router.get("/sessions/:sessionId", controller.getSessionMessages); // open a chat
  router.delete("/sessions/:sessionId", controller.deleteSession); // delete a chat

  // Messaging
  router.post("/message", controller.ventText); // send message
  router.get("/insight", controller.getInsight); // get emotional insight

  return router;
}

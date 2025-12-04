import express from "express";
import * as chatController from "./chat.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";

const router = express.Router();

router.post("/conversations", authenticate, chatController.postConversation);

router.get("/conversations", authenticate, chatController.getConversations);

router.get(
  "/conversations/:conversationId/messages",
  authenticate,
  chatController.getMessages
);

export default router;

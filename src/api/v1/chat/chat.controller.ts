import { Request, Response } from "express";
import * as chatService from "./chat.service";
import { prisma } from "../../../infrastructure/prisma/client";

export async function postConversation(req: Request, res: Response) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    const conv = await chatService.getOrCreateConversationForBooking(bookingId);
    return res.json(conv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "internal error" });
  }
}

export async function getConversations(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const convs = await chatService.listConversationsForUser(userId);
    return res.json(convs);
  } catch (err) {
    return res.status(500).json({ error: "internal error" });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { conversationId } = req.params;
    const { cursor, limit } = req.query;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) return res.status(404).json({ error: "not found" });
    if (![conv.clientId, conv.therapistId].includes(userId))
      return res.status(403).json({ error: "forbidden" });

    const messages = await chatService.fetchMessages(
      conversationId,
      Number(limit || 50),
      cursor as string | undefined
    );

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: "internal error" });
  }
}

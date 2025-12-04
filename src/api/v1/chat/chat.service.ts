import { prisma } from "../../../infrastructure/prisma/client";
import { MessageType } from "./chat.dto";

export async function getOrCreateConversationForBooking(bookingId: string) {
  const existing = await prisma.conversation.findUnique({ where: { bookingId } });
  if (existing) return existing;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  return prisma.conversation.create({
    data: {
      bookingId,
      clientId: booking.clientId,
      therapistId: booking.therapistId,
    },
  });
}

export async function listConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ clientId: userId }, { therapistId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      booking: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function fetchMessages(conversationId: string, limit = 50, cursor?: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      attachments: true,
      sender: true,
    },
  });

  return messages.reverse();
}

export async function createMessage(params: {
  conversationId: string;
  senderId: string;
  type?: MessageType;
  content?: string;
  attachments?: { url: string; filename: string; mimeType: string; sizeBytes: number }[];
  meta?: any;
}) {
  const msg = await prisma.message.create({
    data: {
      conversation: { connect: { id: params.conversationId } },
      sender: { connect: { id: params.senderId } },
      type: params.type ?? "TEXT",
      content: params.content,
      meta: params.meta,
      attachments: params.attachments?.length
        ? { create: params.attachments }
        : undefined,
    },
    include: { attachments: true, sender: true },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: msg.createdAt },
  });

  return msg;
}

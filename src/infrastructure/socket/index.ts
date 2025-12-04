import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { createMessage } from "../../api/v1/chat/chat.service";

export function initSocket(server: any, jwtSecret: string) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.toString().split(" ")[1];

      if (!token) throw new Error("unauthenticated");

      const decoded = jwt.verify(token, jwtSecret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user)  throw new Error("unauthenticated");

      (socket as any).user = user;
      next();
    } catch (err) {
      throw new Error("unauthenticated");
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;

    socket.join(`user:${user.id}`);

    socket.on("join_conversation", async (conversationId: string, cb) => {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conv) return cb?.({ error: "not_found" });
      if (![conv.clientId, conv.therapistId].includes(user.id))
        return cb?.({ error: "forbidden" });

      socket.join(`conversation:${conversationId}`);
      cb?.({ ok: true });
    });

    socket.on("send_message", async (payload, ack) => {
      try {
        const { conversationId, type, content, attachments, meta } = payload;

        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conv || ![conv.clientId, conv.therapistId].includes(user.id)) {
          return ack?.({ error: "forbidden" });
        }

        const msg = await createMessage({
          conversationId,
          senderId: user.id,
          type,
          content,
          attachments,
          meta,
        });

        io.to(`conversation:${conversationId}`).emit("message", msg);

        const participants = [conv.clientId, conv.therapistId];
        participants.forEach((id) => {
          io.to(`user:${id}`).emit("notification", {
            type: "NEW_MESSAGE",
            messageId: msg.id,
            conversationId,
            from: user.id,
            preview: msg.content?.slice(0, 150),
          });
        });

        ack?.({ ok: true });
      } catch (err) {
        console.error(err);
        ack?.({ error: "failed" });
      }
    });
  });

  return io;
}

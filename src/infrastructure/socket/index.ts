import { Server } from "socket.io";
import http from "http";
import { prisma } from "../prisma/client";
// import { UserRole } from "@prisma/client";

interface SocketAuth {
  userId: string;
  role: "THERAPIST" | "CLIENT" | "ADMIN";
}

let io: Server | null = null;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const auth = socket.handshake.auth as SocketAuth | undefined;

    if (!auth?.userId) {
      socket.disconnect();
      return;
    }

    const userId = auth.userId;
    const role = auth.role;

    // Base room per user
    socket.join(`user:${userId}`);

    if (role === "THERAPIST") {
      const therapist = await prisma.therapistProfile.findUnique({
        where: { userId },
      });
      if (therapist) {
        socket.join(`therapist:${therapist.id}`);
      }
    }

    if (role === "CLIENT") {
      const client = await prisma.clientProfile.findUnique({
        where: { userId },
      });
      if (client) {
        socket.join(`client:${client.id}`);
      }
    }

    // Join a booking room when UI opens that chat
    socket.on("joinBooking", (payload: { bookingId: string }) => {
      if (payload?.bookingId) {
        socket.join(`booking:${payload.bookingId}`);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`Socket connected userId=${userId}`);
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

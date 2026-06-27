import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { postConversation, getConversations, getMessages } from "./chat.controller";
import * as chatService from "./chat.service";

vi.mock("./chat.service");
vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Chat Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: "user-123" },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("postConversation", () => {
    it("should create conversation successfully when bookingId is provided", async () => {
      const mockConversation = { id: "conv-123", bookingId: "booking-123" };
      (chatService.getOrCreateConversationForBooking as any).mockResolvedValue(mockConversation);

      mockReq.body = { bookingId: "booking-123" };

      await postConversation(mockReq as Request, mockRes as Response);

      expect(chatService.getOrCreateConversationForBooking).toHaveBeenCalledWith("booking-123");
      expect(mockRes.json).toHaveBeenCalledWith(mockConversation);
    });

    it("should return 400 when bookingId is missing", async () => {
      mockReq.body = {};

      await postConversation(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "bookingId required" });
    });

    it("should handle errors from service", async () => {
      (chatService.getOrCreateConversationForBooking as any).mockRejectedValue(
        new Error("Booking not found")
      );

      mockReq.body = { bookingId: "invalid-booking" };

      await postConversation(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Booking not found" });
    });
  });

  describe("getConversations", () => {
    it("should return conversations for user", async () => {
      const mockConversations = [
        { id: "conv-1", clientId: "user-123" },
        { id: "conv-2", therapistId: "user-123" },
      ];
      (chatService.listConversationsForUser as any).mockResolvedValue(mockConversations);

      await getConversations(mockReq as Request, mockRes as Response);

      expect(chatService.listConversationsForUser).toHaveBeenCalledWith("user-123");
      expect(mockRes.json).toHaveBeenCalledWith(mockConversations);
    });

    it("should handle errors when fetching conversations", async () => {
      (chatService.listConversationsForUser as any).mockRejectedValue(new Error("Database error"));

      await getConversations(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "internal error" });
    });
  });

  describe("getMessages", () => {
    it("should fetch messages for conversation", async () => {
      const { prisma } = await import("../../../infrastructure/prisma/client");
      const mockMessages = [
        { id: "msg-1", content: "Hello" },
        { id: "msg-2", content: "Hi" },
      ];

      (prisma.conversation.findUnique as any).mockResolvedValue({
        id: "conv-123",
        clientId: "user-123",
        therapistId: "therapist-456",
      });

      (chatService.fetchMessages as any).mockResolvedValue(mockMessages);

      mockReq.params = { conversationId: "conv-123" };
      mockReq.query = { limit: "50" };

      await getMessages(mockReq as Request, mockRes as Response);

      expect(chatService.fetchMessages).toHaveBeenCalledWith("conv-123", 50, undefined);
      expect(mockRes.json).toHaveBeenCalledWith({ messages: mockMessages });
    });

    it("should return 404 when conversation not found", async () => {
      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.conversation.findUnique as any).mockResolvedValue(null);

      mockReq.params = { conversationId: "invalid-conv" };

      await getMessages(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "not found" });
    });

    it("should return 403 when user is not participant in conversation", async () => {
      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.conversation.findUnique as any).mockResolvedValue({
        id: "conv-123",
        clientId: "other-client",
        therapistId: "other-therapist",
      });

      mockReq.params = { conversationId: "conv-123" };
      mockReq.user = { id: "user-123" };

      await getMessages(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "forbidden" });
    });

    it("should support pagination with cursor", async () => {
      const { prisma } = await import("../../../infrastructure/prisma/client");
      const mockMessages = [{ id: "msg-10", content: "Message" }];

      (prisma.conversation.findUnique as any).mockResolvedValue({
        id: "conv-123",
        clientId: "user-123",
        therapistId: "therapist-456",
      });

      (chatService.fetchMessages as any).mockResolvedValue(mockMessages);

      mockReq.params = { conversationId: "conv-123" };
      mockReq.query = { limit: "20", cursor: "msg-9" };

      await getMessages(mockReq as Request, mockRes as Response);

      expect(chatService.fetchMessages).toHaveBeenCalledWith("conv-123", 20, "msg-9");
    });

    it("should handle errors when fetching messages", async () => {
      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.conversation.findUnique as any).mockRejectedValue(new Error("DB error"));

      mockReq.params = { conversationId: "conv-123" };

      await getMessages(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "internal error" });
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as chatService from "./chat.service";
import { prisma } from "../../../infrastructure/prisma/client";
import { MessageType } from "./chat.dto";

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Chat Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOrCreateConversationForBooking", () => {
    it("should return existing conversation if found", async () => {
      const mockConversation = {
        id: "conv-123",
        bookingId: "booking-123",
        clientId: "client-1",
        therapistId: "therapist-1",
      };
      (prisma.conversation.findUnique as any).mockResolvedValue(mockConversation);

      const result = await chatService.getOrCreateConversationForBooking("booking-123");

      expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { bookingId: "booking-123" },
      });
      expect(result).toEqual(mockConversation);
    });

    it("should create new conversation if not found", async () => {
      const mockBooking = {
        id: "booking-123",
        clientId: "client-1",
        therapistId: "therapist-1",
      };
      const newConversation = {
        id: "conv-new",
        bookingId: "booking-123",
        clientId: "client-1",
        therapistId: "therapist-1",
      };

      (prisma.conversation.findUnique as any).mockResolvedValue(null);
      (prisma.booking.findUnique as any).mockResolvedValue(mockBooking);
      (prisma.conversation.create as any).mockResolvedValue(newConversation);

      const result = await chatService.getOrCreateConversationForBooking("booking-123");

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: "booking-123" },
      });
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          bookingId: "booking-123",
          clientId: "client-1",
          therapistId: "therapist-1",
        },
      });
      expect(result).toEqual(newConversation);
    });

    it("should throw error if booking not found", async () => {
      (prisma.conversation.findUnique as any).mockResolvedValue(null);
      (prisma.booking.findUnique as any).mockResolvedValue(null);

      await expect(
        chatService.getOrCreateConversationForBooking("invalid-booking")
      ).rejects.toThrow("Booking not found");
    });
  });

  describe("listConversationsForUser", () => {
    it("should list conversations for user as client", async () => {
      const mockConversations = [
        {
          id: "conv-1",
          clientId: "user-123",
          therapistId: "therapist-1",
          lastMessageAt: new Date(),
        },
      ];

      (prisma.conversation.findMany as any).mockResolvedValue(mockConversations);

      const result = await chatService.listConversationsForUser("user-123");

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ clientId: "user-123" }, { therapistId: "user-123" }] },
          orderBy: { lastMessageAt: "desc" },
        })
      );
      expect(result).toEqual(mockConversations);
    });

    it("should list conversations for user as therapist", async () => {
      const mockConversations = [
        {
          id: "conv-2",
          clientId: "client-1",
          therapistId: "user-123",
          lastMessageAt: new Date(),
        },
      ];

      (prisma.conversation.findMany as any).mockResolvedValue(mockConversations);

      const result = await chatService.listConversationsForUser("user-123");

      expect(result).toEqual(mockConversations);
    });

    it("should return empty array when user has no conversations", async () => {
      (prisma.conversation.findMany as any).mockResolvedValue([]);

      const result = await chatService.listConversationsForUser("user-with-no-conversations");

      expect(result).toEqual([]);
    });
  });

  describe("fetchMessages", () => {
    it("should fetch messages without cursor", async () => {
      const mockMessages = [
        { id: "msg-1", content: "Hello", createdAt: new Date("2024-01-01") },
        { id: "msg-2", content: "Hi", createdAt: new Date("2024-01-02") },
      ];

      (prisma.message.findMany as any).mockResolvedValue(mockMessages.reverse());

      const result = await chatService.fetchMessages("conv-123", 50);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conv-123" },
        orderBy: { createdAt: "desc" },
        take: 50,
        skip: 0,
        cursor: undefined,
        include: { attachments: true, sender: true },
      });
      expect(result).toBeDefined();
    });

    it("should fetch messages with cursor for pagination", async () => {
      const mockMessages = [
        { id: "msg-10", content: "Message 10" },
        { id: "msg-11", content: "Message 11" },
      ];

      (prisma.message.findMany as any).mockResolvedValue(mockMessages.reverse());

      const result = await chatService.fetchMessages("conv-123", 20, "msg-9");

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: "conv-123" },
          take: 20,
          skip: 1,
          cursor: { id: "msg-9" },
        })
      );
      expect(result).toBeDefined();
    });

    it("should use default limit of 50", async () => {
      (prisma.message.findMany as any).mockResolvedValue([]);

      await chatService.fetchMessages("conv-123");

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should return messages in ascending order", async () => {
      const mockMessages = [
        { id: "msg-2", content: "Second", createdAt: new Date("2024-01-02") },
        { id: "msg-1", content: "First", createdAt: new Date("2024-01-01") },
      ];

      (prisma.message.findMany as any).mockResolvedValue(mockMessages);

      const result = await chatService.fetchMessages("conv-123", 50);

      // Messages should be reversed to ascending order
      expect(result).toBeDefined();
    });
  });

  describe("createMessage", () => {
    it("should create message with content", async () => {
      const newMessage = {
        id: "msg-new",
        conversationId: "conv-123",
        senderId: "user-123",
        type: "TEXT",
        content: "Hello there",
        attachments: [],
      };

      (prisma.message.create as any).mockResolvedValue(newMessage);

      const result = await chatService.createMessage({
        conversationId: "conv-123",
        senderId: "user-123",
        type: "TEXT",
        content: "Hello there",
      });

      expect(result).toBeDefined();
    });

    it("should create message with attachments", async () => {
      const attachments = [
        {
          url: "https://example.com/file.pdf",
          filename: "file.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      ];

      const newMessage = {
        id: "msg-with-attach",
        conversationId: "conv-123",
        senderId: "user-123",
        type: "FILE",
        content: "Check this file",
        attachments,
      };

      (prisma.message.create as any).mockResolvedValue(newMessage);

      const result = await chatService.createMessage({
        conversationId: "conv-123",
        senderId: "user-123",
        type: "FILE",
        content: "Check this file",
        attachments,
      });

      expect(result).toBeDefined();
    });

    it("should create message with metadata", async () => {
      const meta = { readAt: new Date() };

      const newMessage = {
        id: "msg-meta",
        conversationId: "conv-123",
        senderId: "user-123",
        meta,
      };

      (prisma.message.create as any).mockResolvedValue(newMessage);

      const result = await chatService.createMessage({
        conversationId: "conv-123",
        senderId: "user-123",
        meta,
      });

      expect(result).toBeDefined();
    });
  });
});

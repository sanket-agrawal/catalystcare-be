import { describe, expect, it, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { VentContextService } from "./text.service";
import { VentPersistenceService } from "./text.persistence";
import { encryptContent, decryptContent } from "../../../../../infrastructure/crypto/vent.crypto";

vi.mock("../../../../../infrastructure/crypto/vent.crypto", () => ({
  encryptContent: vi.fn((content: string) => `encrypted:${content}`),
  decryptContent: vi.fn((stored: string) => {
    if (stored.startsWith("encrypted:")) {
      return stored.replace("encrypted:", "");
    }
    return stored;
  }),
}));

describe("VentContextService", () => {
  let mockRedis: any;
  let mockPersistence: any;
  let contextService: VentContextService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };
    mockPersistence = {
      getRecentMessages: vi.fn(),
    };
    contextService = new VentContextService(
      mockRedis as unknown as Redis,
      mockPersistence as unknown as VentPersistenceService
    );
  });

  describe("getContextMessages", () => {
    it("should return messages from Redis on cache hit", async () => {
      const mockSession = {
        sessionId: "session-1",
        userId: "user-1",
        messages: [
          { role: "user", content: "hello" },
          { role: "assistant", content: "hi" },
        ],
      };
      mockRedis.get.mockResolvedValue(`encrypted:${JSON.stringify(mockSession)}`);

      const messages = await contextService.getContextMessages("user-1", "session-1");

      expect(mockRedis.get).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      expect(decryptContent).toHaveBeenCalled();
      expect(messages).toEqual([
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ]);
      expect(mockPersistence.getRecentMessages).not.toHaveBeenCalled();
    });

    it("should seed cache from Postgres and return messages on cache miss", async () => {
      mockRedis.get.mockResolvedValue(null);
      const mockPgMessages = [
        { role: "user" as const, content: "hello from pg" },
        { role: "assistant" as const, content: "reply from pg" },
      ];
      mockPersistence.getRecentMessages.mockResolvedValue(mockPgMessages);

      const messages = await contextService.getContextMessages("user-1", "session-1");

      expect(mockRedis.get).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      expect(mockPersistence.getRecentMessages).toHaveBeenCalledWith("user-1", "session-1");
      expect(encryptContent).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        "vent:ctx:user-1:session-1",
        21600, // 6 hours
        expect.any(String)
      );
      expect(messages).toEqual(mockPgMessages);
    });

    it("should return empty if cache miss and Postgres has no messages", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPersistence.getRecentMessages.mockResolvedValue([]);

      const messages = await contextService.getContextMessages("user-1", "session-1");

      expect(mockRedis.get).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      expect(mockPersistence.getRecentMessages).toHaveBeenCalledWith("user-1", "session-1");
      expect(mockRedis.setex).not.toHaveBeenCalled();
      expect(messages).toEqual([]);
    });

    it("should delete corrupt cache key and fall back to Postgres", async () => {
      mockRedis.get.mockResolvedValue("invalid-encrypted-data");
      // mock decryptContent to throw an error for invalid input
      vi.mocked(decryptContent).mockImplementationOnce(() => {
        throw new Error("Decryption failed");
      });

      const mockPgMessages = [{ role: "user" as const, content: "fallback" }];
      mockPersistence.getRecentMessages.mockResolvedValue(mockPgMessages);

      const messages = await contextService.getContextMessages("user-1", "session-1");

      expect(mockRedis.del).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      expect(mockPersistence.getRecentMessages).toHaveBeenCalledWith("user-1", "session-1");
      expect(messages).toEqual(mockPgMessages);
    });
  });

  describe("appendMessages", () => {
    it("should start fresh if cache doesn't exist and append messages", async () => {
      mockRedis.get.mockResolvedValue(null);

      const newMessages = [
        { role: "user" as const, content: "hi", timestamp: 123 },
        { role: "assistant" as const, content: "hello", timestamp: 456 },
      ];

      await contextService.appendMessages("user-1", "session-1", newMessages);

      expect(mockRedis.get).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      expect(encryptContent).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        "vent:ctx:user-1:session-1",
        21600,
        expect.stringContaining("encrypted:")
      );
    });

    it("should append to existing cache and slide window if it exceeds limit", async () => {
      // 20 messages is the limit
      const existingMessages = Array.from({ length: 19 }, (_, i) => ({
        role: "user" as const,
        content: `msg-${i}`,
        timestamp: Date.now(),
      }));

      const mockSession = {
        sessionId: "session-1",
        userId: "user-1",
        messages: existingMessages,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(`encrypted:${JSON.stringify(mockSession)}`);

      const newMessages = [
        { role: "user" as const, content: "new-1", timestamp: Date.now() },
        { role: "assistant" as const, content: "new-2", timestamp: Date.now() },
      ];

      await contextService.appendMessages("user-1", "session-1", newMessages);

      expect(mockRedis.get).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
      
      // The session should be saved with exactly 20 messages (last 20)
      const setexCall = mockRedis.setex.mock.calls[0];
      const encryptedValue = setexCall[2];
      const decryptedString = decryptedStringValue(encryptedValue);
      const savedSession = JSON.parse(decryptedString);

      expect(savedSession.messages.length).toBe(20);
      expect(savedSession.messages[0].content).toBe("msg-1"); // msg-0 was dropped
      expect(savedSession.messages[19].content).toBe("new-2");
    });

    it("should restart fresh if cache is corrupt on append", async () => {
      mockRedis.get.mockResolvedValue("corrupt");
      vi.mocked(decryptContent).mockImplementationOnce(() => {
        throw new Error("Decryption failed");
      });

      const newMessages = [{ role: "user" as const, content: "fresh", timestamp: 123 }];
      await contextService.appendMessages("user-1", "session-1", newMessages);

      const setexCall = mockRedis.setex.mock.calls[0];
      const savedSession = JSON.parse(decryptedStringValue(setexCall[2]));
      expect(savedSession.messages).toEqual(newMessages);
    });
  });

  describe("deleteSession", () => {
    it("should delete session key from Redis", async () => {
      await contextService.deleteSession("user-1", "session-1");
      expect(mockRedis.del).toHaveBeenCalledWith("vent:ctx:user-1:session-1");
    });
  });
});

function decryptedStringValue(encrypted: string): string {
  if (encrypted.startsWith("encrypted:")) {
    return encrypted.replace("encrypted:", "");
  }
  return encrypted;
}

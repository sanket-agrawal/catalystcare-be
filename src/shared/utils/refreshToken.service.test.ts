import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock crypto.randomUUID
vi.mock("crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("crypto")>();
  return {
    ...original,
    randomUUID: vi.fn(),
  };
});

import { prisma } from "../../infrastructure/prisma/client";
import { Response } from "express";
import {
  clearRefreshTokenCookie,
  generateRefreshToken,
  revokeAllUserRefreshTokens,
  revokeSingleRefreshToken,
  setRefreshTokenCookie,
  validateAndRotateRefreshToken,
} from "./refreshToken.service";

// Mock prisma client
vi.mock("../../infrastructure/prisma/client", () => ({
  prisma: {
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("refreshToken.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("generateRefreshToken", () => {
    it("should generate a token, save to db, and return the token string", async () => {
      const { randomUUID } = await import("crypto");
      (randomUUID as any).mockReturnValueOnce("mocked-uuid-1");

      const userId = "user-123";
      const expectedExpiresAt = new Date("2026-05-31T12:10:00.000Z");

      (prisma.refreshToken.create as any).mockResolvedValue({ id: "token-id" });

      const result = await generateRefreshToken(userId);

      expect(result).toBe("mocked-uuid-1");
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: "mocked-uuid-1",
          userId,
          expiresAt: expectedExpiresAt,
        },
      });
    });
  });

  describe("validateAndRotateRefreshToken", () => {
    it("should rotate valid refresh token successfully", async () => {
      const { randomUUID } = await import("crypto");
      (randomUUID as any).mockReturnValueOnce("mocked-uuid-2");

      const oldToken = "mocked-uuid-1";
      const userId = "user-123";
      const existingTokenRecord = {
        id: "record-123",
        token: oldToken,
        userId,
        expiresAt: new Date("2026-05-31T12:05:00.000Z"), // valid
      };

      (prisma.refreshToken.findUnique as any).mockResolvedValue(existingTokenRecord);

      const result = await validateAndRotateRefreshToken(oldToken);

      expect(result).toEqual({
        userId,
        newToken: "mocked-uuid-2",
      });

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: oldToken },
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: "record-123" },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: "mocked-uuid-2",
          userId,
          expiresAt: new Date("2026-05-31T12:10:00.000Z"),
        },
      });
    });

    it("should throw error if token does not exist in database", async () => {
      (prisma.refreshToken.findUnique as any).mockResolvedValue(null);

      await expect(validateAndRotateRefreshToken("non-existent-token")).rejects.toThrow(
        "Invalid refresh token"
      );
      expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("should throw error and clean up token if it has expired", async () => {
      const expiredToken = "expired-token-123";
      const existingTokenRecord = {
        id: "record-123",
        token: expiredToken,
        userId: "user-123",
        expiresAt: new Date("2026-05-31T11:55:00.000Z"), // expired relative to 12:00:00
      };

      (prisma.refreshToken.findUnique as any).mockResolvedValue(existingTokenRecord);

      await expect(validateAndRotateRefreshToken(expiredToken)).rejects.toThrow(
        "Refresh token expired"
      );

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: "record-123" },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("revokeAllUserRefreshTokens", () => {
    it("should delete all tokens matching userId", async () => {
      const userId = "user-123";
      await revokeAllUserRefreshTokens(userId);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe("revokeSingleRefreshToken", () => {
    it("should delete the single token", async () => {
      const token = "some-token";
      await revokeSingleRefreshToken(token);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token },
      });
    });
  });

  describe("setRefreshTokenCookie", () => {
    it("should call res.cookie with the correct parameters", () => {
      const mockRes = {
        cookie: vi.fn(),
      } as unknown as Response;

      const token = "test-token";
      setRefreshTokenCookie(mockRes, token);

      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 10 * 60 * 1000,
        path: "/",
      });
    });
  });

  describe("clearRefreshTokenCookie", () => {
    it("should call res.clearCookie with the correct parameters", () => {
      const mockRes = {
        clearCookie: vi.fn(),
      } as unknown as Response;

      clearRefreshTokenCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
    });
  });
});

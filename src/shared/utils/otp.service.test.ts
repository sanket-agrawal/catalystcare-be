import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const otpBcryptMocks = vi.hoisted(() => ({
  compare: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: otpBcryptMocks.compare,
    hash: vi.fn(),
  },
}));

import { OTPService } from "./otp.service";
import { prisma } from "../../infrastructure/prisma/client";
import ApiError from "./ApiError";

// Mock prisma
vi.mock("../../infrastructure/prisma/client", () => ({
  prisma: {
    oTPVerification: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock hashOtp
vi.mock("./hashPassword", () => ({
  hashOtp: vi.fn(),
}));

describe("OTPService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateOTP", () => {
    it("should generate and store OTP successfully", async () => {
      const mockHashedOtp = "hashed-otp-123456";
      const { hashOtp } = await import("./hashPassword");

      (hashOtp as any).mockResolvedValue(mockHashedOtp);
      (prisma.oTPVerification.create as any).mockResolvedValue({ id: 1 });

      const otp = await OTPService.generateOTP("test@example.com");

      expect(otp).toMatch(/^\d{6}$/);
      expect(hashOtp).toHaveBeenCalledWith(otp);
      expect(prisma.oTPVerification.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          otp: mockHashedOtp,
          expiresAt: expect.any(Date),
        },
      });
    });

    it("propagates database errors (not wrapped as ApiError)", async () => {
      const { hashOtp } = await import("./hashPassword");

      (hashOtp as any).mockResolvedValue("hashed-otp");
      (prisma.oTPVerification.create as any).mockRejectedValue(new Error("DB Error"));

      await expect(OTPService.generateOTP("test@example.com")).rejects.toThrow("DB Error");
    });
  });

  describe("verifyOTP", () => {
    it("should verify valid OTP successfully", async () => {
      const mockRecord = {
        id: 1,
        email: "test@example.com",
        otp: "hashed-otp-123456",
        verified: false,
        expiresAt: new Date(Date.now() + 10000),
      };

      (prisma.oTPVerification.findFirst as any).mockResolvedValue(mockRecord);
      (prisma.oTPVerification.update as any).mockResolvedValue({});
      otpBcryptMocks.compare.mockResolvedValue(true as never);

      const result = await OTPService.verifyOTP("test@example.com", "123456");

      expect(result).toBe(true);
      expect(prisma.oTPVerification.findFirst).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          verified: false,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(prisma.oTPVerification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { verified: true },
      });
    });

    it("should throw ApiError for expired OTP", async () => {
      (prisma.oTPVerification.findFirst as any).mockResolvedValue(null);

      await expect(OTPService.verifyOTP("test@example.com", "123456")).rejects.toThrow(ApiError);
      expect((prisma.oTPVerification.findFirst as any).mock.calls[0][0].where.expiresAt.gt).toBeInstanceOf(Date);
    });

    it("should throw ApiError for invalid OTP", async () => {
      const mockRecord = {
        id: 1,
        email: "test@example.com",
        otp: "hashed-wrong-otp",
        verified: false,
        expiresAt: new Date(Date.now() + 10000),
      };

      (prisma.oTPVerification.findFirst as any).mockResolvedValue(mockRecord);
      otpBcryptMocks.compare.mockResolvedValue(false as never);

      await expect(OTPService.verifyOTP("test@example.com", "123456")).rejects.toThrow(ApiError);
    });

    it("should throw ApiError for already verified OTP", async () => {
      const mockRecord = {
        id: 1,
        email: "test@example.com",
        otp: "hashed-otp",
        verified: true,
        expiresAt: new Date(Date.now() + 10000),
      };

      (prisma.oTPVerification.findFirst as any).mockResolvedValue(mockRecord);

      await expect(OTPService.verifyOTP("test@example.com", "123456")).rejects.toThrow(ApiError);
    });
  });
});

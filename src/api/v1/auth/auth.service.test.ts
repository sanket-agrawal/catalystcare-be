import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authCryptoMocks = vi.hoisted(() => ({
  bcryptCompare: vi.fn(),
  jwtSign: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: authCryptoMocks.bcryptCompare,
    hash: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: authCryptoMocks.jwtSign,
  },
}));

import {
  registerUserService,
  verifyOTPService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
  verifyForgotPasswordOTPService,
} from "./auth.service";
import { prisma } from "../../../infrastructure/prisma/client";
import ApiError from "../../../shared/utils/ApiError";
import { OTPService } from "../../../shared/utils/otp.service";
import { emailQueue } from "../../../infrastructure/queues/index";

// Mock all dependencies
vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oTPVerification: {
      findFirst: vi.fn(),
    },
    clientProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    therapistProfile: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../../../shared/utils/hashPassword", () => ({
  hashPassword: vi.fn(),
}));

vi.mock("../../../shared/utils/otp.service", () => ({
  OTPService: {
    generateOTP: vi.fn(),
    verifyOTP: vi.fn(),
  },
}));

vi.mock("../../../infrastructure/queues/index", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

vi.mock("../../../shared/config/email.config", () => ({
  emailFromAddress: vi.fn(() => ({ otpSending: "noreply@test.com" })),
  emailSubjects: vi.fn(() => ({ otpVerification: "OTP Verification" })),
}));

vi.mock("../../../shared/email-templates/auth", () => ({
  otpVerificationTemplate: vi.fn(),
  welcomeEmailTemplate: vi.fn(),
  forgotPasswordOtpTemplate: vi.fn(),
}));

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("JWT_SECRET", "test-jwt-secret-for-unit-tests");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerUserService", () => {
    it("should register user successfully and send OTP", async () => {
      const userData = {
        email: "test@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      (prisma.user.findFirst as any).mockResolvedValue(null);
      (OTPService.generateOTP as any).mockResolvedValue("123456");
      (emailQueue.add as any).mockResolvedValue({});

      await expect(registerUserService(userData)).resolves.not.toThrow();

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: "test@example.com" }, { mobileNumber: "1234567890" }],
        },
      });
      expect(OTPService.generateOTP).toHaveBeenCalledWith("test@example.com");
      expect(emailQueue.add).toHaveBeenCalledWith(
        "sendOtp",
        expect.objectContaining({
          to: "test@example.com",
          subject: "OTP Verification",
        })
      );
    });

    it("should throw ApiError if email already exists", async () => {
      const userData = {
        email: "existing@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      (prisma.user.findFirst as any).mockResolvedValue({
        email: "existing@example.com",
        mobileNumber: "0987654321",
      });

      await expect(registerUserService(userData)).rejects.toThrow(ApiError);
      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(OTPService.generateOTP).not.toHaveBeenCalled();
    });

    it("should throw ApiError if mobile number already exists", async () => {
      const userData = {
        email: "new@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      (prisma.user.findFirst as any).mockResolvedValue({
        email: "existing@example.com",
        mobileNumber: "1234567890",
      });

      await expect(registerUserService(userData)).rejects.toThrow(ApiError);
    });
  });

  describe("verifyOTPService", () => {
    it("should verify OTP and create user successfully", async () => {
      const verifyData = {
        email: "test@example.com",
        otp: "123456",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        mobileNumber: "1234567890",
      };

      (OTPService.verifyOTP as any).mockResolvedValue(true);
      (prisma.user.findFirst as any).mockResolvedValue(null);
      const { hashPassword } = await import("../../../shared/utils/hashPassword");
      (hashPassword as any).mockResolvedValue("hashed-password");
      (prisma.user.create as any).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT",
      });
      (prisma.clientProfile.findUnique as any).mockResolvedValue(null);
      (prisma.clientProfile.create as any).mockResolvedValue({
        id: 10,
        userId: 1,
      });
      authCryptoMocks.jwtSign.mockReturnValue("signed-token" as never);

      const result = await verifyOTPService(verifyData);

      expect(OTPService.verifyOTP).toHaveBeenCalledWith("test@example.com", "123456");
      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed-password",
          firstName: "John",
          lastName: "Doe",
          mobileNumber: "1234567890",
          role: "CLIENT",
          isEmailVerified: true,
        },
      });
      expect(result).toHaveProperty("token", "signed-token");
      expect(result).toHaveProperty("user");
    });

    it("should throw ApiError if OTP verification fails", async () => {
      const verifyData = {
        email: "test@example.com",
        otp: "wrong-otp",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        mobileNumber: "1234567890",
      };

      (OTPService.verifyOTP as any).mockRejectedValue(new ApiError(400, "Invalid OTP"));

      await expect(verifyOTPService(verifyData)).rejects.toThrow(ApiError);
    });
  });

  describe("loginService", () => {
    it("should login user successfully", async () => {
      const email = "test@example.com";
      const password = "password123";

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
        firstName: "John",
      };

      (prisma.user.findFirst as any).mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
        lastName: "Doe",
        profilePhoto: null,
        role: "CLIENT",
      });
      (prisma.user.update as any).mockResolvedValue({});
      (prisma.clientProfile.findUnique as any).mockResolvedValue(null);

      authCryptoMocks.bcryptCompare.mockResolvedValue(true as never);
      authCryptoMocks.jwtSign.mockReturnValue("mock-jwt-token" as never);

      const result = await loginService(email, password);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(result).toHaveProperty("token", "mock-jwt-token");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("message");
    });

    it("should throw ApiError for non-existent user", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(null);

      await expect(loginService("nonexistent@example.com", "password")).rejects.toThrow(ApiError);
    });

    it("should throw ApiError for invalid password", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
      };

      (prisma.user.findFirst as any).mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
        lastName: null,
        profilePhoto: null,
        role: "CLIENT",
      });

      authCryptoMocks.bcryptCompare.mockResolvedValue(false as never);

      await expect(loginService("test@example.com", "wrong-password")).rejects.toThrow(ApiError);
    });
  });

  describe("forgotPasswordService", () => {
    it("should send forgot password OTP successfully", async () => {
      const email = "test@example.com";

      (prisma.user.findFirst as any).mockResolvedValue({
        id: 1,
        email,
        firstName: "John",
      });
      (OTPService.generateOTP as any).mockResolvedValue("123456");
      (emailQueue.add as any).mockResolvedValue({});

      await expect(forgotPasswordService(email)).resolves.not.toThrow();

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      expect(OTPService.generateOTP).toHaveBeenCalledWith(email);
      expect(emailQueue.add).toHaveBeenCalledWith(
        "forgotPasswordSendOtp",
        expect.objectContaining({
          to: email,
        })
      );
    });

    it("should throw ApiError for non-existent user", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(null);

      await expect(forgotPasswordService("nonexistent@example.com")).rejects.toThrow(ApiError);
    });
  });

  describe("resetPasswordService", () => {
    it("should reset password successfully", async () => {
      const newPassword = "newpassword123";
      const confirmPassword = "newpassword123";
      const email = "test@example.com";

      (prisma.user.findUnique as any).mockResolvedValue({ id: 1, email });
      const { hashPassword } = await import("../../../shared/utils/hashPassword");
      (hashPassword as any).mockResolvedValue("hashed-new-password");
      (prisma.user.update as any).mockResolvedValue({});

      await expect(
        resetPasswordService(newPassword, confirmPassword, email)
      ).resolves.not.toThrow();

      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: { password: "hashed-new-password" },
      });
    });

    it("should throw ApiError for mismatched passwords", async () => {
      await expect(resetPasswordService("pass1", "pass2", "test@example.com")).rejects.toThrow(
        ApiError
      );
    });

    it("should throw ApiError for non-existent user", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(resetPasswordService("pass", "pass", "nonexistent@example.com")).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("verifyForgotPasswordOTPService", () => {
    it("should verify forgot password OTP successfully", async () => {
      const email = "test@example.com";
      const otp = "123456";

      (OTPService.verifyOTP as any).mockResolvedValue(true);

      const result = await verifyForgotPasswordOTPService(email, otp);

      expect(OTPService.verifyOTP).toHaveBeenCalledWith(email, otp);
      expect(result).toBe(true);
    });

    it("should throw ApiError for invalid OTP", async () => {
      (OTPService.verifyOTP as any).mockRejectedValue(new ApiError(400, "Invalid OTP"));

      await expect(verifyForgotPasswordOTPService("test@example.com", "wrong-otp")).rejects.toThrow(
        ApiError
      );
    });
  });
});

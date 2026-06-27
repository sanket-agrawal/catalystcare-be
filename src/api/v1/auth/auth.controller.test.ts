import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { registerUser, verifyOTP, login, forgotPassword, resetPassword } from "./auth.controller";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";

// Mock dependencies (keep real ApiError so `instanceof` in controllers works)
vi.mock("./auth.service");
vi.mock("../../../shared/utils/ApiResponse");
vi.mock("../../../infrastructure/google/googleSignin.service");

describe("Auth Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerUser", () => {
    it("should register user successfully", async () => {
      const { registerUserService } = await import("./auth.service");
      (registerUserService as any).mockResolvedValue({});

      mockReq.body = {
        email: "test@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      await registerUser(mockReq as Request, mockRes as Response);

      expect(registerUserService).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(ApiResponse).toHaveBeenCalledWith(true, 201, "OTP Sent Sucessfully");
    });

    it("should handle ApiError from service", async () => {
      const { registerUserService } = await import("./auth.service");
      const apiError = new ApiError(409, "Email already registered");
      (registerUserService as any).mockRejectedValue(apiError);

      mockReq.body = {
        email: "existing@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      await registerUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(ApiResponse).toHaveBeenCalledWith(false, 409, "Email already registered");
    });

    it("should handle generic errors", async () => {
      const { registerUserService } = await import("./auth.service");
      (registerUserService as any).mockRejectedValue(new Error("Database error"));

      mockReq.body = {
        email: "test@example.com",
        mobileNumber: "1234567890",
        firstName: "John",
      };

      await registerUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(false, 500, "Internal Server Error");
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP successfully", async () => {
      const { verifyOTPService } = await import("./auth.service");
      const mockResult = { token: "jwt-token", user: { id: 1, email: "test@example.com" } };
      (verifyOTPService as any).mockResolvedValue(mockResult);

      mockReq.body = {
        email: "test@example.com",
        otp: "123456",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        mobileNumber: "1234567890",
      };

      await verifyOTP(mockReq as Request, mockRes as Response);

      expect(verifyOTPService).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "OTP verified and user logged in",
        mockResult
      );
    });

    it("should handle ApiError from service", async () => {
      const { verifyOTPService } = await import("./auth.service");
      const apiError = new ApiError(400, "Invalid OTP");
      (verifyOTPService as any).mockRejectedValue(apiError);

      mockReq.body = {
        email: "test@example.com",
        otp: "wrong-otp",
      };

      await verifyOTP(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Invalid OTP");
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const { loginService } = await import("./auth.service");
      const mockResult = {
        token: "jwt-token",
        user: { id: 1, email: "test@example.com" },
        message: "Login successful",
      };
      (loginService as any).mockResolvedValue(mockResult);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
        source: "credentials",
      };

      await login(mockReq as Request, mockRes as Response);

      expect(loginService).toHaveBeenCalledWith("test@example.com", "password123", "credentials");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, mockResult.message, {
        token: mockResult.token,
        user: mockResult.user,
      });
    });

    it("should handle ApiError from service", async () => {
      const { loginService } = await import("./auth.service");
      const apiError = new ApiError(401, "Invalid credentials");
      (loginService as any).mockRejectedValue(apiError);

      mockReq.body = {
        email: "test@example.com",
        password: "wrong-password",
      };

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(ApiResponse).toHaveBeenCalledWith(false, 401, "Invalid credentials");
    });
  });

  describe("forgotPassword", () => {
    it("should send forgot password OTP successfully", async () => {
      const { forgotPasswordService } = await import("./auth.service");
      (forgotPasswordService as any).mockResolvedValue({});

      mockReq.body = { email: "test@example.com" };

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(forgotPasswordService).toHaveBeenCalledWith("test@example.com");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, "Otp Sent Successfully");
    });

    it("should handle ApiError from service", async () => {
      const { forgotPasswordService } = await import("./auth.service");
      const apiError = new ApiError(404, "User not found");
      (forgotPasswordService as any).mockRejectedValue(apiError);

      mockReq.body = { email: "nonexistent@example.com" };

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(ApiResponse).toHaveBeenCalledWith(false, 404, "User not found");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const { resetPasswordService } = await import("./auth.service");
      (resetPasswordService as any).mockResolvedValue({});

      mockReq.body = {
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
        email: "test@example.com",
      };

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(resetPasswordService).toHaveBeenCalledWith(
        "newpassword123",
        "newpassword123",
        "test@example.com"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, "Password reset sucessfull");
    });

    it("should handle ApiError from service", async () => {
      const { resetPasswordService } = await import("./auth.service");
      const apiError = new ApiError(400, "Passwords do not match");
      (resetPasswordService as any).mockRejectedValue(apiError);

      mockReq.body = {
        newPassword: "pass1",
        confirmPassword: "pass2",
        email: "test@example.com",
      };

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Passwords do not match");
    });
  });
});

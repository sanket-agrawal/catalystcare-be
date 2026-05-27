import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import ApiError from "../../../../shared/utils/ApiError";

vi.mock("../../../../infrastructure/google/connectCalendar.service", () => ({
  connectCalendarService: {
    authenticate: vi.fn(),
    callback: vi.fn(),
  },
}));
vi.mock("../../../../shared/utils/ApiResponse");

import { googleAuthController } from "./googleAuth.controller";

describe("Google Auth Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      user: { id: "user-123", email: "test@example.com" },
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      redirect: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("authenticate", () => {
    it("should generate Google auth URL successfully", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      const mockUrl = "https://accounts.google.com/o/oauth2/v2/auth?...";
      (connectCalendarService.authenticate as any).mockResolvedValue(mockUrl);

      await googleAuthController.authenticate(mockReq as Request, mockRes as Response);

      expect(connectCalendarService.authenticate).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle ApiError during authentication", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      const apiError = new ApiError(500, "Google service unavailable");
      (connectCalendarService.authenticate as any).mockRejectedValue(apiError);

      await googleAuthController.authenticate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors during authentication", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      (connectCalendarService.authenticate as any).mockRejectedValue(new Error("Connection error"));

      await googleAuthController.authenticate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("callback", () => {
    it("should handle callback with valid code and state", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      const redirectUrl = "http://localhost/dashboard?status=connected";
      (connectCalendarService.callback as any).mockResolvedValue(redirectUrl);

      mockReq.query = { code: "auth-code-123", state: "state-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(connectCalendarService.callback).toHaveBeenCalledWith("auth-code-123", "state-123");
      expect(mockRes.redirect).toHaveBeenCalledWith(redirectUrl);
    });

    it("should reject callback without code parameter", async () => {
      mockReq.query = { state: "state-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject callback without state parameter", async () => {
      mockReq.query = { code: "auth-code-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject callback when code is not a string", async () => {
      mockReq.query = { code: ["auth-code-123"], state: "state-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle ApiError from connectCalendarService.callback", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      const apiError = new ApiError(403, "Invalid authorization code");
      (connectCalendarService.callback as any).mockRejectedValue(apiError);

      mockReq.query = { code: "invalid-code", state: "state-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("should handle generic errors in callback", async () => {
      const { connectCalendarService } =
        await import("../../../../infrastructure/google/connectCalendar.service");
      (connectCalendarService.callback as any).mockRejectedValue(new Error("Service error"));

      mockReq.query = { code: "auth-code-123", state: "state-123" };

      await googleAuthController.callback(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

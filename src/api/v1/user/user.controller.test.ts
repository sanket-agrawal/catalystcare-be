import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { userProfile, updateUserProfile } from "./user.controller";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";

// Mock dependencies
vi.mock("./user.service");
vi.mock("../../../shared/utils/ApiResponse");

describe("User Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("userProfile", () => {
    it("should fetch user profile successfully and return 200", async () => {
      const { userService } = await import("./user.service");
      const mockResult = {
        userProfile: { id: "user-1", email: "test@example.com" },
        clientProfile: { ageGroup: "ADULT" },
      };
      (userService.userProfileService as any).mockResolvedValue(mockResult);

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };

      await userProfile(mockReq as Request, mockRes as Response);

      expect(userService.userProfileService).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "User profile fetched successfully",
        mockResult
      );
    });

    it("should handle ApiError from service", async () => {
      const { userService } = await import("./user.service");
      const apiError = new ApiError(404, "User profile not found");
      (userService.userProfileService as any).mockRejectedValue(apiError);

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };

      await userProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(ApiResponse).toHaveBeenCalledWith(false, 404, "User profile not found");
    });

    it("should handle generic errors", async () => {
      const { userService } = await import("./user.service");
      (userService.userProfileService as any).mockRejectedValue(new Error("Database error"));

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };

      await userProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        500,
        "Something went wrong while fetching user profile"
      );
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile successfully and return 200", async () => {
      const { userService } = await import("./user.service");
      const mockResult = {
        userProfile: { id: "user-1", firstName: "NewName" },
      };
      (userService.updateUserProfileService as any).mockResolvedValue(mockResult);

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };
      mockReq.body = {
        firstName: "NewName",
      };

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(userService.updateUserProfileService).toHaveBeenCalledWith(mockReq.user, mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "User profile updated successfully",
        mockResult
      );
    });

    it("should handle ApiError from service on update", async () => {
      const { userService } = await import("./user.service");
      const apiError = new ApiError(400, "Validation failed");
      (userService.updateUserProfileService as any).mockRejectedValue(apiError);

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };
      mockReq.body = {
        firstName: "",
      };

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Validation failed");
    });

    it("should handle generic errors on update", async () => {
      const { userService } = await import("./user.service");
      (userService.updateUserProfileService as any).mockRejectedValue(
        new Error("Database write error")
      );

      mockReq.user = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "CLIENT",
      };
      mockReq.body = {
        firstName: "NewName",
      };

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        500,
        "Something went wrong while fetching user profile"
      );
    });
  });
});

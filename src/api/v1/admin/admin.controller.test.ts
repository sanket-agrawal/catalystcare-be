import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { adminController } from "./admin.controller";
import { adminService } from "./admin.service";
import ApiError from "../../../shared/utils/ApiError";

vi.mock("./admin.service");
vi.mock("../../../shared/utils/ApiResponse");

describe("Admin Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
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

  describe("fetchTherapistProfiles", () => {
    it("should fetch all therapist profiles successfully", async () => {
      const mockProfiles = [
        {
          id: "profile-1",
          userId: "user-1",
          status: "PENDING",
          user: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            mobileNumber: "1234567890",
            profilePhoto: "https://example.com/photo.jpg",
          },
          categories: [{ id: "cat-1", name: "Mental Health" }],
          subCategories: [],
        },
      ];

      (adminService.getAllTherapistProfiles as any).mockResolvedValue(mockProfiles);

      await adminController.fetchTherapistProfiles(mockReq as Request, mockRes as Response);

      expect(adminService.getAllTherapistProfiles).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Database connection failed");
      (adminService.getAllTherapistProfiles as any).mockRejectedValue(apiError);

      await adminController.fetchTherapistProfiles(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (adminService.getAllTherapistProfiles as any).mockRejectedValue(
        new Error("Unexpected error")
      );

      await adminController.fetchTherapistProfiles(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("approveRejectTherapistProfile", () => {
    it("should approve therapist profile successfully", async () => {
      const mockUpdatedProfile = {
        id: "profile-1",
        status: "APPROVED",
        userId: "user-1",
      };

      (adminService.approveRejectTherapistProfile as any).mockResolvedValue(mockUpdatedProfile);

      mockReq.params = { profileId: "profile-1" };
      mockReq.body = { approve: true };

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(adminService.approveRejectTherapistProfile).toHaveBeenCalledWith("profile-1", true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should reject therapist profile successfully", async () => {
      const mockUpdatedProfile = {
        id: "profile-1",
        status: "REJECTED",
        userId: "user-1",
      };

      (adminService.approveRejectTherapistProfile as any).mockResolvedValue(mockUpdatedProfile);

      mockReq.params = { profileId: "profile-1" };
      mockReq.body = { approve: false };

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(adminService.approveRejectTherapistProfile).toHaveBeenCalledWith("profile-1", false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when approve is not a boolean", async () => {
      mockReq.params = { profileId: "profile-1" };
      mockReq.body = { approve: "true" }; // String instead of boolean

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when approve is null", async () => {
      mockReq.params = { profileId: "profile-1" };
      mockReq.body = { approve: null };

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Profile not found");
      (adminService.approveRejectTherapistProfile as any).mockRejectedValue(apiError);

      mockReq.params = { profileId: "invalid-id" };
      mockReq.body = { approve: true };

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle generic errors", async () => {
      (adminService.approveRejectTherapistProfile as any).mockRejectedValue(
        new Error("Service error")
      );

      mockReq.params = { profileId: "profile-1" };
      mockReq.body = { approve: true };

      await adminController.approveRejectTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

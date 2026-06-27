import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { therapistController } from "./therapist.controller";
import { therapistService } from "./therapist.service";
import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";

vi.mock("./therapist.service");
vi.mock("../../../shared/utils/ApiResponse");

describe("Therapist Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: {
        id: "user-1",
        email: "therapist@example.com",
        firstName: "Jane",
        lastName: "Doe",
        therapistProfileId: "therapist-profile-1",
      },
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

  describe("registeration", () => {
    it("should register a therapist successfully", async () => {
      const mockResult = { id: "therapist-profile-1" };
      (therapistService.register as any).mockResolvedValue(mockResult);

      mockReq.body = { licenseNumber: "LIC-12345" };

      await therapistController.registeration(mockReq as Request, mockRes as Response);

      expect(therapistService.register).toHaveBeenCalledWith(
        "user-1",
        { licenseNumber: "LIC-12345" },
        "therapist@example.com",
        "Jane",
        "Doe"
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(ApiResponse).toHaveBeenCalledWith(true, 201, "Therapist Registered Successfully");
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(409, "A profile already exists");
      (therapistService.register as any).mockRejectedValue(apiError);

      await therapistController.registeration(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(ApiResponse).toHaveBeenCalledWith(false, 409, "A profile already exists");
    });

    it("should handle generic errors", async () => {
      (therapistService.register as any).mockRejectedValue(new Error("Database connection error"));

      await therapistController.registeration(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(ApiResponse).toHaveBeenCalledWith(false, 500, "Internal Server Error");
    });
  });

  describe("profile", () => {
    it("should fetch therapist profile successfully", async () => {
      const mockProfile = { id: "therapist-profile-1", status: "PENDING" };
      (therapistService.profile as any).mockResolvedValue(mockProfile);

      await therapistController.profile(mockReq as Request, mockRes as Response);

      expect(therapistService.profile).toHaveBeenCalledWith("therapist-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Profile fetched successfully",
        mockProfile
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Profile not found");
      (therapistService.profile as any).mockRejectedValue(apiError);

      await therapistController.profile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(ApiResponse).toHaveBeenCalledWith(false, 404, "Profile not found");
    });

    it("should handle generic errors", async () => {
      (therapistService.profile as any).mockRejectedValue(new Error("Unexpected failure"));

      await therapistController.profile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Internal Server Error");
    });
  });

  describe("fetchBookings", () => {
    it("should fetch bookings successfully", async () => {
      const mockBookings = [{ id: "booking-1", status: "CONFIRMED" }];
      (therapistService.fetchBookings as any).mockResolvedValue(mockBookings);

      await therapistController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(therapistService.fetchBookings).toHaveBeenCalledWith("therapist-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Booking Fetched Successfully",
        mockBookings
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(401, "Unauthorized");
      (therapistService.fetchBookings as any).mockRejectedValue(apiError);

      await therapistController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should handle generic errors", async () => {
      (therapistService.fetchBookings as any).mockRejectedValue(new Error("Unexpected error"));

      await therapistController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("setUPIVPA", () => {
    it("should set UPI VPA successfully", async () => {
      const mockUpdated = { id: "therapist-profile-1", upiVpaHash: "hashed-vpa" };
      (therapistService.setTherapistUpiVpa as any).mockResolvedValue(mockUpdated);

      mockReq.body = { vpa: "test@upi" };

      await therapistController.setUPIVPA(mockReq as Request, mockRes as Response);

      expect(therapistService.setTherapistUpiVpa).toHaveBeenCalledWith(
        "therapist-profile-1",
        "test@upi"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist VPA updated successfully",
        mockUpdated
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(400, "Invalid VPA format");
      (therapistService.setTherapistUpiVpa as any).mockRejectedValue(apiError);

      await therapistController.setUPIVPA(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle generic errors", async () => {
      (therapistService.setTherapistUpiVpa as any).mockRejectedValue(new Error("Crypto error"));

      await therapistController.setUPIVPA(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("fetchMaskedVPA", () => {
    it("should fetch masked VPA successfully", async () => {
      const mockMasked = "t***@upi";
      (therapistService.fetchTherapistMaskedVpa as any).mockResolvedValue(mockMasked);

      await therapistController.fetchMaskedVPA(mockReq as Request, mockRes as Response);

      expect(therapistService.fetchTherapistMaskedVpa).toHaveBeenCalledWith("therapist-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Masked VPA Fetched Successfully",
        mockMasked
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Not found");
      (therapistService.fetchTherapistMaskedVpa as any).mockRejectedValue(apiError);

      await therapistController.fetchMaskedVPA(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle generic errors", async () => {
      (therapistService.fetchTherapistMaskedVpa as any).mockRejectedValue(
        new Error("Decryption failure")
      );

      await therapistController.fetchMaskedVPA(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("therapistBillingDashboard", () => {
    it("should fetch therapist billing dashboard successfully", async () => {
      const mockDashboard = { netEarnings: 100, totalRevenue: 120, totalClients: 2 };
      (therapistService.therapistBillingDashboard as any).mockResolvedValue(mockDashboard);

      await therapistController.therapistBillingDashboard(mockReq as Request, mockRes as Response);

      expect(therapistService.therapistBillingDashboard).toHaveBeenCalledWith(
        "therapist-profile-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Billing Dashboard Fetched Success",
        mockDashboard
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Database error");
      (therapistService.therapistBillingDashboard as any).mockRejectedValue(apiError);

      await therapistController.therapistBillingDashboard(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (therapistService.therapistBillingDashboard as any).mockRejectedValue(
        new Error("Database fail")
      );

      await therapistController.therapistBillingDashboard(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateTherapistProfile", () => {
    it("should update profile successfully", async () => {
      const mockUpdated = { id: "therapist-profile-1", about: "updated text" };
      (therapistService.updateTherapistProfile as any).mockResolvedValue(mockUpdated);

      mockReq.body = { about: "updated text" };

      await therapistController.updateTherapistProfile(mockReq as Request, mockRes as Response);

      expect(therapistService.updateTherapistProfile).toHaveBeenCalledWith("therapist-profile-1", {
        about: "updated text",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Profile Updated Successfully",
        mockUpdated
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(403, "Forbidden update");
      (therapistService.updateTherapistProfile as any).mockRejectedValue(apiError);

      await therapistController.updateTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("should handle generic errors", async () => {
      (therapistService.updateTherapistProfile as any).mockRejectedValue(new Error("Prisma error"));

      await therapistController.updateTherapistProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("pendingList", () => {
    it("should fetch pending list successfully", async () => {
      const mockPending = [{ type: "SESSION", bookingType: "SINGLE" }];
      (therapistService.pendingList as any).mockResolvedValue(mockPending);

      await therapistController.pendingList(mockReq as Request, mockRes as Response);

      expect(therapistService.pendingList).toHaveBeenCalledWith("therapist-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Pending Lists Fetched Successfully",
        mockPending
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Redis down");
      (therapistService.pendingList as any).mockRejectedValue(apiError);

      await therapistController.pendingList(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (therapistService.pendingList as any).mockRejectedValue(new Error("Queue error"));

      await therapistController.pendingList(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("therapistProgramBillingDashboard", () => {
    it("should fetch program billing dashboard successfully", async () => {
      const mockDashboard = { netEarnings: 500, totalRevenue: 600, totalClients: 5 };
      (therapistService.therapistProgramBillingDashboard as any).mockResolvedValue(mockDashboard);

      await therapistController.therapistProgramBillingDashboard(
        mockReq as Request,
        mockRes as Response
      );

      expect(therapistService.therapistProgramBillingDashboard).toHaveBeenCalledWith(
        "therapist-profile-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapist Billing Dashboard Fetched Success",
        mockDashboard
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Prisma dashboard error");
      (therapistService.therapistProgramBillingDashboard as any).mockRejectedValue(apiError);

      await therapistController.therapistProgramBillingDashboard(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (therapistService.therapistProgramBillingDashboard as any).mockRejectedValue(
        new Error("Fatal dashboard error")
      );

      await therapistController.therapistProgramBillingDashboard(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { clientController } from "./client.controller";
import { clientService } from "./client.service";
import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";

vi.mock("./client.service");
vi.mock("../../../shared/utils/ApiResponse");

describe("Client Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: {
        id: "user-client-1",
        email: "client@example.com",
        firstName: "Jane",
        lastName: "Client",
        role: "CLIENT",
        clientProfileId: "client-profile-1",
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

  describe("profileUpdate", () => {
    it("should successfully update client profile", async () => {
      const mockUpdated = { id: "client-profile-1", ageGroup: "ADULT" };
      (clientService.profileUpdate as any).mockResolvedValue(mockUpdated);

      mockReq.body = { ageGroup: "ADULT" };

      await clientController.profileUpdate(mockReq as Request, mockRes as Response);

      expect(clientService.profileUpdate).toHaveBeenCalledWith(mockReq.user, { ageGroup: "ADULT" });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        20,
        "Profile Updated Sucessfully",
        mockUpdated
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(400, "Validation failed");
      (clientService.profileUpdate as any).mockRejectedValue(apiError);

      await clientController.profileUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle generic errors", async () => {
      (clientService.profileUpdate as any).mockRejectedValue(
        new Error("Prisma connection failure")
      );

      await clientController.profileUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("assessmentSubmit", () => {
    it("should submit assessment successfully", async () => {
      const mockResult = { id: "assessment-result-1", score: 15 };
      (clientService.assessmentSubmit as any).mockResolvedValue(mockResult);

      mockReq.body = { responses: [] };

      await clientController.assessmentSubmit(mockReq as Request, mockRes as Response);

      expect(clientService.assessmentSubmit).toHaveBeenCalledWith("user-client-1", {
        responses: [],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Assessment submitted successfully",
        mockResult
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Questions not found");
      (clientService.assessmentSubmit as any).mockRejectedValue(apiError);

      await clientController.assessmentSubmit(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle generic errors", async () => {
      (clientService.assessmentSubmit as any).mockRejectedValue(
        new Error("Generic submission error")
      );

      await clientController.assessmentSubmit(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAssessments", () => {
    it("should fetch user assessments successfully", async () => {
      const mockAssessments = [{ id: "assess-1", score: 10 }];
      (clientService.getAssessments as any).mockResolvedValue(mockAssessments);

      await clientController.getAssessments(mockReq as Request, mockRes as Response);

      expect(clientService.getAssessments).toHaveBeenCalledWith("user-client-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Assessments fetched successfully",
        mockAssessments
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Database fetch failed");
      (clientService.getAssessments as any).mockRejectedValue(apiError);

      await clientController.getAssessments(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (clientService.getAssessments as any).mockRejectedValue(new Error("Unknown fetch error"));

      await clientController.getAssessments(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getTherapistsByUserNeeds", () => {
    it("should fetch therapists successfully", async () => {
      const mockTherapists = [{ id: "therapist-1", name: "Dr. Smith" }];
      (clientService.getTherapistByUserNeeds as any).mockResolvedValue(mockTherapists);

      mockReq.params = { assessmentId: "assess-1" };

      await clientController.getTherapistsByUserNeeds(mockReq as Request, mockRes as Response);

      expect(clientService.getTherapistByUserNeeds).toHaveBeenCalledWith(mockReq.user, "assess-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Therapists Fetched Successfully",
        mockTherapists
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Assessment result not found");
      (clientService.getTherapistByUserNeeds as any).mockRejectedValue(apiError);

      await clientController.getTherapistsByUserNeeds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle generic errors", async () => {
      (clientService.getTherapistByUserNeeds as any).mockRejectedValue(new Error("Service error"));

      await clientController.getTherapistsByUserNeeds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("fetchBookings", () => {
    it("should fetch client bookings successfully", async () => {
      const mockBookings = [{ id: "booking-1", startDateTime: new Date() }];
      (clientService.fetchBookings as any).mockResolvedValue(mockBookings);

      await clientController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(clientService.fetchBookings).toHaveBeenCalledWith("client-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Bookings Fetched Successfully",
        mockBookings
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(401, "Unauthorized access");
      (clientService.fetchBookings as any).mockRejectedValue(apiError);

      await clientController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should handle generic errors", async () => {
      (clientService.fetchBookings as any).mockRejectedValue(new Error("DB read error"));

      await clientController.fetchBookings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("pendingList", () => {
    it("should fetch client pending list successfully", async () => {
      const mockPending = [{ type: "SESSION", bookingType: "SINGLE" }];
      (clientService.pendingList as any).mockResolvedValue(mockPending);

      await clientController.pendingList(mockReq as Request, mockRes as Response);

      expect(clientService.pendingList).toHaveBeenCalledWith("client-profile-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Client Pending List Fetched Successfully",
        mockPending
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(500, "Cache retrieval failure");
      (clientService.pendingList as any).mockRejectedValue(apiError);

      await clientController.pendingList(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      (clientService.pendingList as any).mockRejectedValue(new Error("Unhandled queue failure"));

      await clientController.pendingList(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminService } from "./admin.service";
import { prisma } from "../../../infrastructure/prisma/client";
import ApiError from "../../../shared/utils/ApiError";

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    therapistProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../../infrastructure/queues");
vi.mock("../../../infrastructure/email");
vi.mock("../../../shared/utils/otp.service");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

describe("Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAllTherapistProfiles", () => {
    it("should fetch all non-approved therapist profiles", async () => {
      const mockProfiles = [
        {
          id: "profile-1",
          status: "PENDING",
          user: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            mobileNumber: "1234567890",
            profilePhoto: null,
          },
          categories: [],
          subCategories: [],
          updatedAt: new Date(),
        },
      ];

      (prisma.therapistProfile.findMany as any).mockResolvedValue(mockProfiles);

      const result = await adminService.getAllTherapistProfiles();

      expect(prisma.therapistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { not: "APPROVED" } },
          orderBy: { updatedAt: "desc" },
        })
      );
      expect(result).toBeDefined();
    });

    it("should return empty array when no pending profiles exist", async () => {
      (prisma.therapistProfile.findMany as any).mockResolvedValue([]);

      const result = await adminService.getAllTherapistProfiles();

      expect(result).toEqual([]);
    });

    it("should exclude approved profiles", async () => {
      (prisma.therapistProfile.findMany as any).mockResolvedValue([]);

      await adminService.getAllTherapistProfiles();

      expect(prisma.therapistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { not: "APPROVED" } },
        })
      );
    });

    it("should order results by updatedAt descending", async () => {
      (prisma.therapistProfile.findMany as any).mockResolvedValue([]);

      await adminService.getAllTherapistProfiles();

      expect(prisma.therapistProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: "desc" },
        })
      );
    });

    it("should throw error when database query fails", async () => {
      (prisma.therapistProfile.findMany as any).mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(adminService.getAllTherapistProfiles()).rejects.toThrow();
    });
  });

  describe("approveRejectTherapistProfile", () => {
    it("should call findUnique with correct profileId", async () => {
      const mockProfile = {
        id: "profile-1",
        status: "PENDING",
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.therapistProfile.update as any).mockResolvedValue({
        ...mockProfile,
        status: "APPROVED",
      });

      await adminService.approveRejectTherapistProfile("profile-1", true);

      expect(prisma.therapistProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "profile-1" },
        })
      );
    });

    it("should throw error when profile not found", async () => {
      (prisma.therapistProfile.findUnique as any).mockResolvedValue(null);

      await expect(adminService.approveRejectTherapistProfile("invalid-id", true)).rejects.toThrow(
        "Therapist profile not found"
      );
    });

    it("should throw error when profile already reviewed", async () => {
      const mockProfile = {
        id: "profile-1",
        status: "APPROVED", // Already reviewed
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockProfile);

      await expect(adminService.approveRejectTherapistProfile("profile-1", true)).rejects.toThrow(
        "Therapist profile already reviewed"
      );
    });

    it("should call update with APPROVED status when approve=true", async () => {
      const mockProfile = {
        id: "profile-1",
        status: "PENDING",
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.therapistProfile.update as any).mockResolvedValue({
        ...mockProfile,
        status: "APPROVED",
      });

      await adminService.approveRejectTherapistProfile("profile-1", true);

      expect(prisma.therapistProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "profile-1" },
          data: expect.objectContaining({
            status: "APPROVED",
          }),
        })
      );
    });

    it("should call update with REJECTED status when approve=false", async () => {
      const mockProfile = {
        id: "profile-1",
        status: "PENDING",
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.therapistProfile.update as any).mockResolvedValue({
        ...mockProfile,
        status: "REJECTED",
      });

      await adminService.approveRejectTherapistProfile("profile-1", false);

      expect(prisma.therapistProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "profile-1" },
          data: expect.objectContaining({
            status: "REJECTED",
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const mockProfile = {
        id: "profile-1",
        status: "PENDING",
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.therapistProfile.update as any).mockRejectedValue(new Error("Database error"));

      await expect(adminService.approveRejectTherapistProfile("profile-1", true)).rejects.toThrow();
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userService } from "./user.service";
import { prisma } from "../../../infrastructure/prisma/client";
import ApiError from "../../../shared/utils/ApiError";

// Mock the Prisma client
vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientProfile: {
      findUnique: vi.fn(),
    },
    therapistProfile: {
      findUnique: vi.fn(),
    },
  },
}));

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("userProfileService", () => {
    it("should fetch CLIENT profile successfully", async () => {
      const mockUser = {
        id: "user-client-1",
        email: "client@test.com",
        firstName: "Client",
        lastName: "User",
        role: "CLIENT" as const,
      };

      const mockUserProfile = {
        id: "user-client-1",
        firstName: "Client",
        lastName: "User",
        email: "client@test.com",
        mobileNumber: "1234567890",
        role: "CLIENT",
        profilePhoto: null,
      };

      const mockClientProfile = {
        ageGroup: "ADULT",
        genderIdentity: "FEMALE",
        occupation: "Engineer",
        seekingSupportFor: "Anxiety",
        relationShipStatus: "SINGLE",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUserProfile);
      (prisma.clientProfile.findUnique as any).mockResolvedValue(mockClientProfile);

      const result = await userService.userProfileService(mockUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-client-1" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobileNumber: true,
          role: true,
          profilePhoto: true,
        },
      });

      expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-client-1" },
        select: {
          ageGroup: true,
          genderIdentity: true,
          occupation: true,
          seekingSupportFor: true,
          relationShipStatus: true,
        },
      });

      expect(result).toEqual({
        userProfile: mockUserProfile,
        clientProfile: mockClientProfile,
      });
    });

    it("should fetch THERAPIST profile successfully", async () => {
      const mockUser = {
        id: "user-therapist-1",
        email: "therapist@test.com",
        firstName: "Therapist",
        lastName: "User",
        role: "THERAPIST" as const,
      };

      const mockUserProfile = {
        id: "user-therapist-1",
        firstName: "Therapist",
        lastName: "User",
        email: "therapist@test.com",
        mobileNumber: "9876543210",
        role: "THERAPIST",
        profilePhoto: "photo-url",
      };

      const mockTherapistProfile = {
        id: "therapist-profile-1",
        userId: "user-therapist-1",
        specialization: "CBT",
        experience: 5,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUserProfile);
      (prisma.therapistProfile.findUnique as any).mockResolvedValue(mockTherapistProfile);

      const result = await userService.userProfileService(mockUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-therapist-1" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobileNumber: true,
          role: true,
          profilePhoto: true,
        },
      });

      expect(prisma.therapistProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-therapist-1" },
      });

      expect(result).toEqual({
        userProfile: mockUserProfile,
        therapistProfile: mockTherapistProfile,
      });
    });

    it("should handle error in userProfileService", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT" as const,
      };

      const mockError = new Error("Database query failed");
      (prisma.user.findUnique as any).mockRejectedValue(mockError);

      await expect(userService.userProfileService(mockUser)).rejects.toThrow(
        "Database query failed"
      );
    });

    it("should propagate ApiError in userProfileService", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT" as const,
      };

      const mockError = new ApiError(404, "User not found");
      (prisma.user.findUnique as any).mockRejectedValue(mockError);

      await expect(userService.userProfileService(mockUser)).rejects.toThrow(ApiError);
    });
  });

  describe("updateUserProfileService", () => {
    it("should update base user fields successfully", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT" as const,
      };

      const updateData = {
        firstName: "Johnny",
        lastName: "Smith",
      };

      const mockUpdatedUser = {
        id: "user-1",
        firstName: "Johnny",
        lastName: "Smith",
        email: "user@test.com",
        mobileNumber: "1234567890",
        role: "CLIENT",
        profilePhoto: null,
      };

      (prisma.user.update as any).mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUserProfileService(mockUser, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobileNumber: true,
          role: true,
          profilePhoto: true,
        },
      });

      expect(result).toEqual({ userProfile: mockUpdatedUser });
    });

    it("should handle error in updateUserProfileService", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT" as const,
      };

      const updateData = { firstName: "Johnny" };
      const mockError = new Error("Update failed");
      (prisma.user.update as any).mockRejectedValue(mockError);

      await expect(userService.updateUserProfileService(mockUser, updateData)).rejects.toThrow(
        "Update failed"
      );
    });

    it("should propagate ApiError in updateUserProfileService", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "CLIENT" as const,
      };

      const updateData = { firstName: "Johnny" };
      const mockError = new ApiError(400, "Invalid name");
      (prisma.user.update as any).mockRejectedValue(mockError);

      await expect(userService.updateUserProfileService(mockUser, updateData)).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("updateClientProfileService", () => {
    it("should run without throwing since it is currently a no-op", async () => {
      await expect(userService.updateClientProfileService("user-1", {})).resolves.toBeUndefined();
    });
  });
});

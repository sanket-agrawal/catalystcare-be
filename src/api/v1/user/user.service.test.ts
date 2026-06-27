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
    extensionUsage: {
      findUnique: vi.fn(),
    },
    ventSession: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    userVentMemory: {
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

  describe("extensionDashboardService", () => {
    const mockUser = {
      id: "user-1",
      email: "user@test.com",
      firstName: "John",
      lastName: "Doe",
      role: "CLIENT" as const,
    };

    it("should fetch dashboard details successfully when extension usage and venting statistics exist", async () => {
      const mockUserDetails = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "user@test.com",
        role: "CLIENT",
        profilePhoto: "photo-url",
        accountType: "EXTENSION_ONLY",
      };

      const mockExtensionUsage = {
        messageCount: 15,
        resetAt: new Date("2026-07-01T00:00:00Z"),
      };

      const mockLastActiveSession = {
        lastActiveAt: new Date("2026-06-01T12:00:00Z"),
      };

      const mockVentMemory = {
        summary: "John has been feeling stressed recently.",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUserDetails);
      (prisma.extensionUsage.findUnique as any).mockResolvedValue(mockExtensionUsage);
      (prisma.ventSession.count as any).mockResolvedValue(5);
      (prisma.ventSession.findFirst as any).mockResolvedValue(mockLastActiveSession);
      (prisma.userVentMemory.findUnique as any).mockResolvedValue(mockVentMemory);

      const result = await userService.extensionDashboardService(mockUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profilePhoto: true,
          accountType: true,
        },
      });
      expect(prisma.extensionUsage.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: { messageCount: true, resetAt: true },
      });
      expect(prisma.ventSession.count).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(prisma.ventSession.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { lastActiveAt: "desc" },
        select: { lastActiveAt: true },
      });
      expect(prisma.userVentMemory.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: { summary: true },
      });

      expect(result).toEqual({
        profile: mockUserDetails,
        extensionUsage: {
          messageCount: 15,
          resetAt: mockExtensionUsage.resetAt,
        },
        ventingSummary: {
          totalSessions: 5,
          lastActiveAt: mockLastActiveSession.lastActiveAt,
          reflectionSummary: "John has been feeling stressed recently.",
        },
      });
    });

    it("should fetch dashboard details with default usage/venting values when they do not exist", async () => {
      const mockUserDetails = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "user@test.com",
        role: "CLIENT",
        profilePhoto: null,
        accountType: "PLATFORM",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUserDetails);
      (prisma.extensionUsage.findUnique as any).mockResolvedValue(null);
      (prisma.ventSession.count as any).mockResolvedValue(0);
      (prisma.ventSession.findFirst as any).mockResolvedValue(null);
      (prisma.userVentMemory.findUnique as any).mockResolvedValue(null);

      const result = await userService.extensionDashboardService(mockUser);

      expect(result).toEqual({
        profile: mockUserDetails,
        extensionUsage: {
          messageCount: 0,
          resetAt: null,
        },
        ventingSummary: {
          totalSessions: 0,
          lastActiveAt: null,
          reflectionSummary: null,
        },
      });
    });

    it("should throw a 404 ApiError if the user is not found in database", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(userService.extensionDashboardService(mockUser)).rejects.toThrow(
        new ApiError(404, "User not found")
      );
    });
  });
});

import ApiError from "../../../shared/utils/ApiError";
import { prisma } from "../../../infrastructure/prisma/client";
import { authenticatedUser, UpdateClientProfileDTO, UpdateUserBaseDTO } from "./user.types";
import { decryptContent } from "../../../infrastructure/crypto/vent.crypto";

export const userService = {
  userProfileService: async (user: authenticatedUser) => {
    try {
      const { id, role } = user;
      const userProfile = await prisma.user.findUnique({
        where: { id },
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

      if (role === "CLIENT") {
        const clientProfile = await prisma.clientProfile.findUnique({
          where: { userId: id },
          select: {
            ageGroup: true,
            genderIdentity: true,
            occupation: true,
            seekingSupportFor: true,
            relationShipStatus: true,
          },
        });
        return { userProfile, clientProfile };
      } else if (role === "THERAPIST") {
        const therapistProfile = await prisma.therapistProfile.findUnique({
          where: { userId: id },
        });
        return { userProfile, therapistProfile };
      }
    } catch (error) {
      if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
      throw error;
    }
  },
  updateUserProfileService: async (user: authenticatedUser, updateData: UpdateUserBaseDTO) => {
    try {
      // ✅ Update base User fields
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
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

      return { userProfile: updatedUser };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      }
      throw error;
    }
  },
  updateClientProfileService: async (userId: string, updateData: UpdateClientProfileDTO) => {
    try {
      // const updatedClientProfile = await prisma.clientProfile.update({
      //     where : { userId },
      //     data : updateData
      // });
      // return updatedClientProfile;
    } catch (error) {
      if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
      throw error;
    }
  },
  extensionDashboardService: async (user: authenticatedUser) => {
    try {
      const { id } = user;

      // 1. Fetch user base details & account type
      const userDetails = await prisma.user.findUnique({
        where: { id },
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

      if (!userDetails) {
        throw new ApiError(404, "User not found");
      }

      // 2. Fetch extension usage
      const extensionUsageRecord = await prisma.extensionUsage.findUnique({
        where: { userId: id },
        select: {
          messageCount: true,
          resetAt: true,
        },
      });

      const extensionUsage = {
        messageCount: extensionUsageRecord?.messageCount ?? 0,
        resetAt: extensionUsageRecord?.resetAt ?? null,
      };

      // 3. Fetch AI venting analytics
      const totalSessions = await prisma.ventSession.count({
        where: { userId: id },
      });

      const lastActiveSession = await prisma.ventSession.findFirst({
        where: { userId: id },
        orderBy: { lastActiveAt: "desc" },
        select: {
          lastActiveAt: true,
        },
      });

      const ventMemory = await prisma.userVentMemory.findUnique({
        where: { userId: id },
        select: {
          summary: true,
        },
      });

      const ventingSummary = {
        totalSessions,
        lastActiveAt: lastActiveSession?.lastActiveAt ?? null,
        reflectionSummary: ventMemory?.summary ? decryptContent(ventMemory?.summary) : null,
      };

      return {
        profile: userDetails,
        extensionUsage,
        ventingSummary,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw error;
    }
  },
};

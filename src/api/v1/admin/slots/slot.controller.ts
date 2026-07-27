import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { availabilityService } from "../../therapist/availability/availability.service";
import { prisma } from "../../../../infrastructure/prisma/client";
import { parseISO, addDays, isValid } from "date-fns";

const AdminSlotController = {
  generateSlotsForTherapist: async (req: Request, res: Response) => {
    try {
      const { therapistId, startDate, endDate, daysAhead } = req.body;

      // --- Input validation ---
      if (!therapistId || typeof therapistId !== "string") {
        throw new ApiError(400, "therapistId is required");
      }

      // Verify therapist exists
      const therapist = await prisma.therapistProfile.findUnique({
        where: { id: therapistId },
        select: { id: true, status: true },
      });

      if (!therapist) {
        throw new ApiError(404, "Therapist not found");
      }

      if (therapist.status !== "APPROVED") {
        throw new ApiError(400, "Slots can only be generated for approved therapists");
      }

      // Parse date range
      const start = startDate ? parseISO(startDate) : new Date();
      if (startDate && !isValid(start)) {
        throw new ApiError(400, "Invalid startDate format. Use ISO 8601 (e.g. 2025-08-01)");
      }

      const end = endDate ? parseISO(endDate) : addDays(start, daysAhead ?? 30);
      if (endDate && !isValid(end)) {
        throw new ApiError(400, "Invalid endDate format. Use ISO 8601 (e.g. 2025-08-31)");
      }

      if (end <= start) {
        throw new ApiError(400, "endDate must be after startDate");
      }

      // --- Generate slots ---
      const result = await availabilityService.generateSlots({
        therapistId,
        startDate: start,
        endDate: end,
      });

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Slots generated successfully", result));
    } catch (error) {
      console.log("Error in Admin Generate Slots:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },
};

export default AdminSlotController;

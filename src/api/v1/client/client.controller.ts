import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { clientService } from "./client.service";

export const clientController = {
  async profileUpdate(req: Request, res: Response) {
    try {
      const updatedProfile = await clientService.profileUpdate(req.user, req.body);
      res
        .status(200)
        .json(new ApiResponse(true, 20, "Profile Updated Sucessfully", updatedProfile));
    } catch (error) {
      console.log("Error in Client Profile Update", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async assessmentSubmit(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const result = await clientService.assessmentSubmit(userId, req.body);

      res.status(200).json(new ApiResponse(true, 200, "Assessment submitted successfully", result));
    } catch (error) {
      console.error("Error in submitting assessment:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async updateAssessment(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const result = await clientService.updateAssessmentAnswer(userId, req.body);

      res
        .status(200)
        .json(new ApiResponse(true, 200, "Assessment answer updated successfully", result));
    } catch (error) {
      console.error("Error in updating assessment answer:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async getAssessments(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const assessments = await clientService.getAssessments(userId);

      res
        .status(200)
        .json(new ApiResponse(true, 200, "Assessments fetched successfully", assessments));
    } catch (error) {
      console.error("Error fetching assessments:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async getTherapistsByUserNeeds(req: Request, res: Response) {
    try {
      const assessmentId = req.params.assessmentId;
      const therapists = await clientService.getTherapistByUserNeeds(req.user, assessmentId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapists Fetched Successfully", therapists));
    } catch (error) {
      console.log("Error in Fetching Client Assesment", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async fetchBookings(req: Request, res: Response) {
    try {
      const clientId = req.user.clientProfileId;
      const therapists = await clientService.fetchBookings(clientId);
      res.status(200).json(new ApiResponse(true, 200, "Bookings Fetched Successfully", therapists));
    } catch (error) {
      console.log("Error in Fetching Client Bookings", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async pendingList(req: Request, res: Response) {
    try {
      const clientId = req.user.clientProfileId;
      const therapists = await clientService.pendingList(clientId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Client Pending List Fetched Successfully", therapists));
    } catch (error) {
      console.log("Error in Fetching Client Pending List", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async getUpcomingBookings(req: Request, res: Response) {
    try {
      const clientId = (req.user as any).clientProfileId;
      if (!clientId) {
        throw new ApiError(400, "Client profile not found for user");
      }
      const bookings = await clientService.getUpcoming7DaysBookings(clientId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Upcoming 7-day bookings fetched successfully", bookings));
    } catch (error) {
      console.log("Error fetching upcoming client bookings:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
  async updateBookingNotes(req: Request, res: Response) {
    try {
      const clientId = req.user.clientProfileId;
      const { bookingId } = req.params;
      const { sessionNotes } = req.body;

      if (!clientId) {
        throw new ApiError(400, "Client profile not found for user");
      }
      if (!bookingId) {
        throw new ApiError(400, "Booking ID is required");
      }

      const updated = await clientService.updateBookingNotes(bookingId, clientId, sessionNotes);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Booking notes updated successfully", updated));
    } catch (error) {
      console.log("Error updating client booking notes:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
  async submitSessionIntake(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const clientId = req.user.clientProfileId;
      const { bookingId } = req.params;

      if (!clientId) {
        throw new ApiError(400, "Client profile not found for user");
      }
      if (!bookingId) {
        throw new ApiError(400, "Booking ID is required");
      }

      const result = await clientService.submitSessionIntake(userId, clientId, bookingId, req.body);

      res
        .status(200)
        .json(new ApiResponse(true, 200, "Session intake submitted successfully", result));
    } catch (error) {
      console.error("Error in submitting session intake:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
};

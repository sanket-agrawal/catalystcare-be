import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import {
  therapistService,
  getUpcoming7DaysTherapistBookings,
  getBookingDetailsForTherapist,
} from "./therapist.service";

export const therapistController = {
  async registeration(req: Request, res: Response) {
    try {
      const therapist = await therapistService.register(
        req.user.id,
        req.body,
        req.user.email,
        req.user.firstName,
        req.user.lastName
      );
      res.status(201).json(new ApiResponse(true, 201, "Therapist Registered Successfully"));
    } catch (error) {
      console.log("Therapist Registeration :", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
  async profile(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const profile = await therapistService.profile(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist Profile fetched successfully", profile));
    } catch (error) {
      console.log("Error fetching therapist profile", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async fetchBookings(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const bookings = await therapistService.fetchBookings(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist Booking Fetched Successfully", bookings));
    } catch (error) {
      console.log("Error fetching therapist bookings", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async setUPIVPA(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const updatedDetails = await therapistService.setTherapistUpiVpa(
        therapistProfileId,
        req.body.vpa
      );
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist VPA updated successfully", updatedDetails));
    } catch (error) {
      console.log("Error seting therapist VPA", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async fetchMaskedVPA(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const maskedVPA = await therapistService.fetchTherapistMaskedVpa(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Masked VPA Fetched Successfully", maskedVPA));
    } catch (error) {
      console.log("Error fetching therapist Masked VPA", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async therapistBillingDashboard(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const billings = await therapistService.therapistBillingDashboard(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist Billing Dashboard Fetched Success", billings));
    } catch (error) {
      console.log("Error fetching therapist billing dashboard", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async updateTherapistProfile(req: Request, res: Response) {
    {
      try {
        const { therapistProfileId } = req.user;
        const updatedProfile = await therapistService.updateTherapistProfile(
          therapistProfileId,
          req.body
        );
        res
          .status(200)
          .json(
            new ApiResponse(true, 200, "Therapist Profile Updated Successfully", updatedProfile)
          );
      } catch (error) {
        console.log("Error updating therapist profile", error);
        if (error instanceof ApiError) {
          res
            .status(error.statusCode)
            .json(new ApiResponse(false, error.statusCode, error.message));
        } else {
          res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
        }
      }
    }
  },
  async pendingList(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const bookings = await therapistService.pendingList(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist Pending Lists Fetched Successfully", bookings));
    } catch (error) {
      console.log("Error fetching therapist pending lists", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async therapistProgramBillingDashboard(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const billings = await therapistService.therapistProgramBillingDashboard(therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Therapist Billing Dashboard Fetched Success", billings));
    } catch (error) {
      console.log("Error fetching therapist billing dashboard", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Internal Server Error"));
      }
    }
  },
  async getUpcomingBookings(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      if (!therapistProfileId) {
        throw new ApiError(400, "Therapist profile not found for user");
      }
      const bookings = await getUpcoming7DaysTherapistBookings(therapistProfileId);
      res
        .status(200)
        .json(
          new ApiResponse(
            true,
            200,
            "Upcoming 7-day therapist bookings fetched successfully",
            bookings
          )
        );
    } catch (error) {
      console.log("Error fetching upcoming therapist bookings:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
  async getBookingDetails(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const { bookingId } = req.params;

      if (!therapistProfileId) {
        throw new ApiError(400, "Therapist profile not found for user");
      }
      if (!bookingId) {
        throw new ApiError(400, "Booking ID is required");
      }

      const booking = await getBookingDetailsForTherapist(bookingId, therapistProfileId);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Booking details fetched successfully", booking));
    } catch (error) {
      console.log("Error fetching booking details:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
  async assignHomework(req: Request, res: Response) {
    try {
      const { therapistProfileId } = req.user;
      const { bookingId } = req.params;
      const { homework } = req.body;

      if (!therapistProfileId) {
        throw new ApiError(400, "Therapist profile not found for user");
      }
      if (!bookingId) {
        throw new ApiError(400, "Booking ID is required");
      }
      if (!homework) {
        throw new ApiError(400, "Homework description is required");
      }

      const result = await therapistService.assignHomework(therapistProfileId, bookingId, homework);

      res.status(200).json(new ApiResponse(true, 200, "Homework assigned successfully", result));
    } catch (error) {
      console.log("Error assigning homework:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
      }
    }
  },
};

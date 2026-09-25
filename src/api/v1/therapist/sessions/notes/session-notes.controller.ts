import { Request, Response } from "express";
import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import SessionNotesService from "./session-notes.service";
import { sessionNotesQuerySchema } from "./session-notes.dto";

const SessionNotesController = {
  createNote: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const note = await SessionNotesService.create(therapistId, req.body);

      return res
        .status(201)
        .json(new ApiResponse(true, 201, "Session note created successfully", note));
    } catch (error) {
      console.error("Error creating session note:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // Update a session note (partial update).
  updateNote: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const { noteId } = req.params;
      const note = await SessionNotesService.update(therapistId, noteId, req.body);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Session note updated successfully", note));
    } catch (error) {
      console.error("Error updating session note:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // Soft-delete a session note.
  deleteNote: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const { noteId } = req.params;
      const result = await SessionNotesService.softDelete(therapistId, noteId);

      return res.status(200).json(new ApiResponse(true, 200, result.message));
    } catch (error) {
      console.error("Error deleting session note:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // Get a single session note by ID.
  getNote: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const { noteId } = req.params;
      const note = await SessionNotesService.getById(therapistId, noteId);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Session note retrieved successfully", note));
    } catch (error) {
      console.error("Error retrieving session note:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // Get session note by booking ID.
  getNoteByBooking: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const { bookingId } = req.params;
      const note = await SessionNotesService.getByBookingId(therapistId, bookingId);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Session note retrieved successfully", note));
    } catch (error) {
      console.error("Error retrieving session note:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // List session notes with pagination.
  listNotes: async (req: Request, res: Response) => {
    try {
      const therapistId = req.user.therapistProfileId;
      const parsed = sessionNotesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((e) => e.message);
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "Invalid query parameters", errors));
      }
      const result = await SessionNotesService.list(therapistId, parsed.data);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Session notes retrieved successfully", result));
    } catch (error) {
      console.error("Error listing session notes:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },
};

export default SessionNotesController;

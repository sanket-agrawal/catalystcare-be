import ApiError from "../../../../../shared/utils/ApiError";
import { prisma } from "../../../../../infrastructure/prisma/client";
import {
  CreateSessionNoteDTO,
  UpdateSessionNoteDTO,
} from "./session-notes.dto";

const SessionNotesService = {
  create: async (therapistId: string, data: CreateSessionNoteDTO) => {
    // Verify booking exists, belongs to this therapist, and is eligible
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        therapistId,
        isActive: true,
      },
      select: {
        id: true,
        status: true,
        sessionNote: { select: { id: true, isDeleted: true } },
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found or does not belong to you");
    }

    if (booking.status !== "COMPLETED" && booking.status !== "CONFIRMED") {
      throw new ApiError(
        400,
        "Session notes can only be added to COMPLETED or CONFIRMED bookings"
      );
    }

    if (booking.sessionNote && !booking.sessionNote.isDeleted) {
      throw new ApiError(
        409,
        "A session note already exists for this booking. Use update instead."
      );
    }

    const { bookingId, ...noteFields } = data;

    const sessionNote = await prisma.sessionNote.upsert({
      where: { bookingId },
      create: {
        bookingId,
        therapistId,
        ...noteFields,
      },
      update: {
        ...noteFields,
        isDeleted: false,
      },
    });

    return sessionNote;
  },



  // Partial update a session note. Ownership enforced.
  update: async (
    therapistId: string,
    noteId: string,
    data: UpdateSessionNoteDTO
  ) => {
    const existingNote = await prisma.sessionNote.findFirst({
      where: {
        id: noteId,
        therapistId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!existingNote) {
      throw new ApiError(404, "Session note not found");
    }

    const updatedNote = await prisma.sessionNote.update({
      where: { id: noteId },
      data,
    });

    return updatedNote;
  },

  
  // Soft-delete a session note. Sets isDeleted = true.
  softDelete: async (therapistId: string, noteId: string) => {
    const existingNote = await prisma.sessionNote.findFirst({
      where: {
        id: noteId,
        therapistId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!existingNote) {
      throw new ApiError(404, "Session note not found");
    }

    await prisma.sessionNote.update({
      where: { id: noteId },
      data: { isDeleted: true },
    });

    return { message: "Session note deleted successfully" };
  },

};

export default SessionNotesService;

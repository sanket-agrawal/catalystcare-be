import ApiError from "../../../../../shared/utils/ApiError";
import { prisma } from "../../../../../infrastructure/prisma/client";
import {
  CreateSessionNoteDTO,
  UpdateSessionNoteDTO,
  SessionNotesQueryDTO,
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
      throw new ApiError(400, "Session notes can only be added to COMPLETED or CONFIRMED bookings");
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
  update: async (therapistId: string, noteId: string, data: UpdateSessionNoteDTO) => {
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

  // Get a session note by booking ID.
  getByBookingId: async (therapistId: string, bookingId: string) => {
    const note = await prisma.sessionNote.findFirst({
      where: {
        bookingId,
        therapistId,
        isDeleted: false,
      },
    });

    if (!note) {
      throw new ApiError(404, "Session note not found for this booking");
    }

    return note;
  },

  // Get a session note by its own ID.
  getById: async (therapistId: string, noteId: string) => {
    const note = await prisma.sessionNote.findFirst({
      where: {
        id: noteId,
        therapistId,
        isDeleted: false,
      },
    });

    if (!note) {
      throw new ApiError(404, "Session note not found");
    }

    return note;
  },

  // List session notes with pagination and optional filters.
  list: async (therapistId: string, query: SessionNotesQueryDTO) => {
    const { page, limit, sessionType, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      therapistId,
      isDeleted: false,
    };

    if (sessionType) {
      where.sessionType = sessionType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [notes, total] = await Promise.all([
      prisma.sessionNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sessionNote.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  },
};

export default SessionNotesService;

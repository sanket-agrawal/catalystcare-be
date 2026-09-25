import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSessionNoteSchema,
  updateSessionNoteSchema,
  sessionNotesQuerySchema,
} from "./session-notes.dto";

// ─── Mock Prisma (vi.hoisted ensures availability during vi.mock hoisting) ───
const mockPrisma = vi.hoisted(() => ({
  booking: {
    findFirst: vi.fn(),
  },
  sessionNote: {
    create: vi.fn(),
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../../../../infrastructure/prisma/client", () => ({
  prisma: mockPrisma,
}));

// Import service AFTER mocks are set up
import SessionNotesService from "./session-notes.service";

const THERAPIST_ID = "a1111111-1111-4111-a111-111111111111";
const BOOKING_ID = "b2222222-2222-4222-a222-222222222222";
const NOTE_ID = "c3333333-3333-4333-a333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── DTO Validation Tests ─────────────────────────────────────────────────────
describe("Session Notes DTO Validation", () => {
  describe("createSessionNoteSchema", () => {
    it("should accept valid create payload", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Client discussed work-related stress.",
        moodBefore: 3,
        moodAfter: 6,
        interventionsUsed: ["CBT", "Mindfulness"],
        riskAssessment: "LOW",
      });
      expect(result.success).toBe(true);
    });

    it("should require bookingId", () => {
      const result = createSessionNoteSchema.safeParse({
        sessionSummary: "Summary text",
      });
      expect(result.success).toBe(false);
    });

    it("should require sessionSummary", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
      });
      expect(result.success).toBe(false);
    });

    it("should reject mood values outside 1-10", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Summary",
        moodBefore: 0,
        moodAfter: 11,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid sessionType", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Summary",
        sessionType: "INVALID_TYPE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid riskAssessment", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Summary",
        riskAssessment: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should default sessionType to INDIVIDUAL", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Summary",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionType).toBe("INDIVIDUAL");
      }
    });

    it("should reject sessionSummary exceeding 10000 chars", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "x".repeat(10001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject more than 20 interventions", () => {
      const result = createSessionNoteSchema.safeParse({
        bookingId: BOOKING_ID,
        sessionSummary: "Summary",
        interventionsUsed: Array(21).fill("CBT"),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateSessionNoteSchema", () => {
    it("should accept partial update", () => {
      const result = updateSessionNoteSchema.safeParse({
        moodAfter: 7,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty payload", () => {
      const result = updateSessionNoteSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("sessionNotesQuerySchema", () => {
    it("should apply defaults for page and limit", () => {
      const result = sessionNotesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should accept valid filter params", () => {
      const result = sessionNotesQuerySchema.safeParse({
        page: "2",
        limit: "5",
        sessionType: "COUPLE",
      });
      expect(result.success).toBe(true);
    });

    it("should reject limit > 50", () => {
      const result = sessionNotesQuerySchema.safeParse({
        limit: "100",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── Service Logic Tests ──────────────────────────────────────────────────────
describe("SessionNotesService", () => {
  describe("create", () => {
    it("should create a note for a valid completed booking", async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: BOOKING_ID,
        status: "COMPLETED",
        sessionNote: null,
      });

      const createdNote = {
        id: NOTE_ID,
        bookingId: BOOKING_ID,
        therapistId: THERAPIST_ID,
        sessionSummary: "Client discussed anxiety triggers.",
        sessionType: "INDIVIDUAL",
        createdAt: new Date(),
      };
      mockPrisma.sessionNote.upsert.mockResolvedValue(createdNote);

      const result = await SessionNotesService.create(THERAPIST_ID, {
        bookingId: BOOKING_ID,
        sessionSummary: "Client discussed anxiety triggers.",
        sessionType: "INDIVIDUAL",
        interventionsUsed: [],
      });

      expect(result).toEqual(createdNote);
      expect(mockPrisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: BOOKING_ID,
            therapistId: THERAPIST_ID,
            isActive: true,
          },
        })
      );
      expect(mockPrisma.sessionNote.upsert).toHaveBeenCalledTimes(1);
    });

    it("should throw 404 if booking not found", async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        SessionNotesService.create(THERAPIST_ID, {
          bookingId: BOOKING_ID,
          sessionSummary: "Summary",
          sessionType: "INDIVIDUAL",
          interventionsUsed: [],
        })
      ).rejects.toThrow("Booking not found or does not belong to you");
    });

    it("should throw 400 if booking is not COMPLETED or CONFIRMED", async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: BOOKING_ID,
        status: "CANCELLED",
        sessionNote: null,
      });

      await expect(
        SessionNotesService.create(THERAPIST_ID, {
          bookingId: BOOKING_ID,
          sessionSummary: "Summary",
          sessionType: "INDIVIDUAL",
          interventionsUsed: [],
        })
      ).rejects.toThrow("Session notes can only be added to COMPLETED or CONFIRMED bookings");
    });

    it("should throw 409 if a note already exists for booking", async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: BOOKING_ID,
        status: "COMPLETED",
        sessionNote: { id: NOTE_ID, isDeleted: false },
      });

      await expect(
        SessionNotesService.create(THERAPIST_ID, {
          bookingId: BOOKING_ID,
          sessionSummary: "Summary",
          sessionType: "INDIVIDUAL",
          interventionsUsed: [],
        })
      ).rejects.toThrow("A session note already exists for this booking. Use update instead.");
    });
  });

  describe("getByBookingId", () => {
    it("should return a note for a valid booking", async () => {
      const note = { id: NOTE_ID, bookingId: BOOKING_ID };
      mockPrisma.sessionNote.findFirst.mockResolvedValue(note);

      const result = await SessionNotesService.getByBookingId(THERAPIST_ID, BOOKING_ID);
      expect(result).toEqual(note);
    });

    it("should throw 404 if no note found", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue(null);

      await expect(SessionNotesService.getByBookingId(THERAPIST_ID, BOOKING_ID)).rejects.toThrow(
        "Session note not found for this booking"
      );
    });
  });

  describe("getById", () => {
    it("should return a note by ID", async () => {
      const note = { id: NOTE_ID };
      mockPrisma.sessionNote.findFirst.mockResolvedValue(note);

      const result = await SessionNotesService.getById(THERAPIST_ID, NOTE_ID);
      expect(result).toEqual(note);
    });

    it("should throw 404 if note not found", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue(null);

      await expect(SessionNotesService.getById(THERAPIST_ID, NOTE_ID)).rejects.toThrow(
        "Session note not found"
      );
    });
  });

  describe("update", () => {
    it("should update an existing note", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue({ id: NOTE_ID });
      const updatedNote = { id: NOTE_ID, moodAfter: 8 };
      mockPrisma.sessionNote.update.mockResolvedValue(updatedNote);

      const result = await SessionNotesService.update(THERAPIST_ID, NOTE_ID, {
        moodAfter: 8,
      });

      expect(result).toEqual(updatedNote);
      expect(mockPrisma.sessionNote.update).toHaveBeenCalledWith({
        where: { id: NOTE_ID },
        data: { moodAfter: 8 },
      });
    });

    it("should throw 404 if note does not exist", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue(null);

      await expect(
        SessionNotesService.update(THERAPIST_ID, NOTE_ID, { moodAfter: 8 })
      ).rejects.toThrow("Session note not found");
    });
  });

  describe("softDelete", () => {
    it("should soft-delete an existing note", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue({ id: NOTE_ID });
      mockPrisma.sessionNote.update.mockResolvedValue({
        id: NOTE_ID,
        isDeleted: true,
      });

      const result = await SessionNotesService.softDelete(THERAPIST_ID, NOTE_ID);
      expect(result.message).toBe("Session note deleted successfully");
      expect(mockPrisma.sessionNote.update).toHaveBeenCalledWith({
        where: { id: NOTE_ID },
        data: { isDeleted: true },
      });
    });

    it("should throw 404 if note does not exist", async () => {
      mockPrisma.sessionNote.findFirst.mockResolvedValue(null);

      await expect(SessionNotesService.softDelete(THERAPIST_ID, NOTE_ID)).rejects.toThrow(
        "Session note not found"
      );
    });
  });

  describe("list", () => {
    it("should return paginated notes", async () => {
      const notes = [{ id: NOTE_ID }];
      mockPrisma.sessionNote.findMany.mockResolvedValue(notes);
      mockPrisma.sessionNote.count.mockResolvedValue(1);

      const result = await SessionNotesService.list(THERAPIST_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.notes).toEqual(notes);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it("should apply sessionType filter", async () => {
      mockPrisma.sessionNote.findMany.mockResolvedValue([]);
      mockPrisma.sessionNote.count.mockResolvedValue(0);

      await SessionNotesService.list(THERAPIST_ID, {
        page: 1,
        limit: 10,
        sessionType: "COUPLE",
      });

      expect(mockPrisma.sessionNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionType: "COUPLE",
          }),
        })
      );
    });

    it("should apply date range filter", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-06-30");
      mockPrisma.sessionNote.findMany.mockResolvedValue([]);
      mockPrisma.sessionNote.count.mockResolvedValue(0);

      await SessionNotesService.list(THERAPIST_ID, {
        page: 1,
        limit: 10,
        startDate,
        endDate,
      });

      expect(mockPrisma.sessionNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        })
      );
    });

    it("should calculate hasNext correctly", async () => {
      mockPrisma.sessionNote.findMany.mockResolvedValue([{ id: "1" }]);
      mockPrisma.sessionNote.count.mockResolvedValue(15);

      const result = await SessionNotesService.list(THERAPIST_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.totalPages).toBe(2);
    });
  });
});

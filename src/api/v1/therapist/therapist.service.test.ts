import { describe, expect, it, vi } from "vitest";
import {
  bookingRescheduleStatus,
  therapistReschedulePermission,
  therapistBookingPermission,
  getUpcoming7DaysTherapistBookings,
  getBookingDetailsForTherapist,
} from "./therapist.service";

describe("Therapist Service Helpers", () => {
  describe("bookingRescheduleStatus", () => {
    it("should return correct status and message for REQUESTED status", () => {
      const result = bookingRescheduleStatus("REQUESTED");
      expect(result).toEqual({
        status: "REQUESTED",
        message: "Reschedule request is pending approval",
      });
    });

    it("should return correct status and message for APPROVED status", () => {
      const result = bookingRescheduleStatus("APPROVED");
      expect(result).toEqual({
        status: "APPROVED",
        message: "Reschedule request has been approved by Admin",
      });
    });

    it("should return correct status and message for REJECTED status", () => {
      const result = bookingRescheduleStatus("REJECTED");
      expect(result).toEqual({
        status: "REJECTED",
        message: "Reschedule request has been rejected by Admin",
      });
    });

    it("should return correct status and empty message for unknown status", () => {
      const result = bookingRescheduleStatus("NONE");
      expect(result).toEqual({
        status: "NONE",
        message: "",
      });
    });
  });

  describe("therapistReschedulePermission", () => {
    it("should return false if therapist has already rescheduled earlier", () => {
      const startDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      const result = therapistReschedulePermission(startDateTime, true, "NONE");
      expect(result).toBe(false);
    });

    it("should return false if session starts in less than 1 hour", () => {
      const startDateTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes in future
      const result = therapistReschedulePermission(startDateTime, false, "NONE");
      expect(result).toBe(false);
    });

    it("should return false if reschedule status is REQUESTED", () => {
      const startDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      const result = therapistReschedulePermission(startDateTime, false, "REQUESTED");
      expect(result).toBe(false);
    });

    it("should return true if not rescheduled earlier, more than 1 hour away, and status is not REQUESTED", () => {
      const startDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      const result = therapistReschedulePermission(startDateTime, false, "NONE");
      expect(result).toBe(true);
    });
  });

  describe("therapistBookingPermission", () => {
    it("should return false for canJoinSession if session starts more than 15 mins in future", () => {
      const start = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes in future
      const end = new Date(Date.now() + 80 * 60 * 1000);
      const result = therapistBookingPermission(start, end, false, "NONE");
      expect(result.canJoinSession).toBe(false);
    });

    it("should return true for canJoinSession if session start is within the 15-minute window", () => {
      const start = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future
      const end = new Date(Date.now() + 70 * 60 * 1000);
      const result = therapistBookingPermission(start, end, false, "NONE");
      expect(result.canJoinSession).toBe(true);
    });

    it("should return false for canJoinSession if session status is REQUESTED even if timing is correct", () => {
      const start = new Date(Date.now() + 10 * 60 * 1000);
      const end = new Date(Date.now() + 70 * 60 * 1000);
      const result = therapistBookingPermission(start, end, false, "REQUESTED");
      expect(result.canJoinSession).toBe(false);
    });

    it("should return false for canJoinSession if session has already ended", () => {
      const start = new Date(Date.now() - 70 * 60 * 1000);
      const end = new Date(Date.now() - 10 * 60 * 1000); // ended 10 minutes ago
      const result = therapistBookingPermission(start, end, false, "NONE");
      expect(result.canJoinSession).toBe(false);
    });

    it("should correctly populate reschedule permission based on helper logic", () => {
      const start = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      const end = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const result = therapistBookingPermission(start, end, false, "NONE");
      expect(result.canReschedule).toBe(true);
      expect(result.rescheduleStatus).toEqual({
        status: "NONE",
        message: "",
      });
    });
  });

  describe("fetchBookings", () => {
    it("should include clientMessage and message mapped from sessionNotes", async () => {
      const now = new Date();
      const mockBooking = {
        id: "booking-1",
        status: "CONFIRMED",
        startDateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endDateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        sessionNotes: "Client wants to discuss anxiety",
        homework: "Do breathing exercise",
        hasTherapistRescheduledEarlier: false,
        rescheduleStatus: "NONE",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        cancellationReason: null,
        client: {
          id: "client-1",
          userId: "user-1",
          ageGroup: "AGE_25_34",
          genderIdentity: "FEMALE",
          occupation: "WORKING_PROFESSIONAL",
          seekingSupportFor: "STRESS_OR_ANXIETY",
          relationShipStatus: "SINGLE",
          aiSummary: "Client summary",
          aiSummaryUpdatedAt: now,
          user: {
            firstName: "Jane",
            lastName: "Doe",
            profilePhoto: null,
            email: "jane@example.com",
            mobileNumber: "1234567890",
          },
        },
      };

      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.booking.findMany as any) = vi.fn().mockResolvedValue([mockBooking]);
      (prisma.clientAssesment.findMany as any) = vi.fn().mockResolvedValue([]);

      const { therapistService } = await import("./therapist.service");
      const bookings = await therapistService.fetchBookings("therapist-1");

      expect(bookings).toHaveLength(1);
      expect(bookings[0].sessionNotes).toBe("Client wants to discuss anxiety");
      expect(bookings[0].clientMessage).toBe("Client wants to discuss anxiety");
      expect(bookings[0].message).toBe("Client wants to discuss anxiety");
      expect(bookings[0].homework).toBe("Do breathing exercise");
    });
  });

  describe("getUpcoming7DaysTherapistBookings", () => {
    it("should include clientMessage and message mapped from sessionNotes", async () => {
      const now = new Date();
      const mockBooking = {
        id: "booking-2",
        bookingType: "SINGLE",
        status: "CONFIRMED",
        startDateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endDateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        sessionNotes: "Upcoming session notes",
        homework: null,
        hasTherapistRescheduledEarlier: false,
        rescheduleStatus: "NONE",
        meetingLink: "https://meet.google.com/xyz",
        createdAt: now,
        programPurchase: null,
        client: {
          id: "client-2",
          userId: "user-2",
          ageGroup: "AGE_18_24",
          genderIdentity: "MALE",
          occupation: "STUDENT",
          seekingSupportFor: "EXPLORE_PERSONAL_GROWTH",
          relationShipStatus: "SINGLE",
          aiSummary: "AI summary",
          aiSummaryUpdatedAt: now,
          user: {
            firstName: "Alex",
            lastName: "Smith",
            profilePhoto: null,
            email: "alex@example.com",
            mobileNumber: "9876543210",
          },
        },
      };

      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.booking.findMany as any) = vi.fn().mockResolvedValue([mockBooking]);
      (prisma.clientAssesment.findMany as any) = vi.fn().mockResolvedValue([]);

      const bookings = await getUpcoming7DaysTherapistBookings("therapist-1");

      expect(bookings).toHaveLength(1);
      expect(bookings[0].sessionNotes).toBe("Upcoming session notes");
      expect(bookings[0].clientMessage).toBe("Upcoming session notes");
      expect(bookings[0].message).toBe("Upcoming session notes");
    });
  });

  describe("getBookingDetailsForTherapist", () => {
    it("should include clientMessage and message mapped from sessionNotes", async () => {
      const now = new Date();
      const mockBooking = {
        id: "booking-3",
        bookingType: "SINGLE",
        status: "CONFIRMED",
        startDateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endDateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        sessionNotes: "Details session notes",
        homework: "Reflect on journal",
        hasTherapistRescheduledEarlier: false,
        rescheduleStatus: "NONE",
        meetingLink: "https://meet.google.com/abc",
        createdAt: now,
        programPurchase: null,
        client: {
          id: "client-3",
          userId: "user-3",
          ageGroup: "AGE_25_34",
          genderIdentity: "FEMALE",
          occupation: "WORKING_PROFESSIONAL",
          seekingSupportFor: "IMPROVE_EMOTIONAL_WELL_BEING",
          relationShipStatus: "MARRIED",
          aiSummary: "Summary",
          aiSummaryUpdatedAt: now,
          user: {
            firstName: "Sarah",
            lastName: "Connor",
            profilePhoto: null,
            email: "sarah@example.com",
            mobileNumber: "1122334455",
          },
        },
      };

      const { prisma } = await import("../../../infrastructure/prisma/client");
      (prisma.booking.findFirst as any) = vi.fn().mockResolvedValue(mockBooking);
      (prisma.clientAssesment.findFirst as any) = vi.fn().mockResolvedValue(null);

      const booking = await getBookingDetailsForTherapist("booking-3", "therapist-1");

      expect(booking.sessionNotes).toBe("Details session notes");
      expect(booking.clientMessage).toBe("Details session notes");
      expect(booking.message).toBe("Details session notes");
      expect(booking.homework).toBe("Reflect on journal");
    });
  });
});

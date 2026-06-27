import { describe, expect, it } from "vitest";
import {
  bookingRescheduleStatus,
  therapistReschedulePermission,
  therapistBookingPermission,
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
});

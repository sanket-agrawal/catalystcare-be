import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailService } from "./email.service";
import ApiError from "../../../shared/utils/ApiError";

const parseCSVMocks = vi.hoisted(() => ({
  parseCSV: vi.fn(),
  parseCSVBuffer: vi.fn(),
}));

vi.mock("../../../shared/utils/parseCSV", () => ({
  parseCSV: parseCSVMocks.parseCSV,
  parseCSVBuffer: parseCSVMocks.parseCSVBuffer,
}));

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("emailBlastService", () => {
    it("should prepare email blast payload for single email", async () => {
      const result = await emailService.emailBlastService({
        target: "SINGLE_EMAIL",
        subject: "Welcome Email",
        content: "Welcome to our service",
        reason: "onboarding",
        adminId: "admin-123",
        singleEmail: "user@example.com",
      });

      expect(result).toEqual({
        target: "SINGLE_EMAIL",
        subject: "Welcome Email",
        content: "Welcome to our service",
        reason: "onboarding",
        adminId: "admin-123",
        singleEmail: "user@example.com",
        csvEmails: [],
      });
    });

    it("should parse CSV and prepare payload for custom CSV target", async () => {
      const mockEmails = ["user1@example.com", "user2@example.com", "user3@example.com"];
      parseCSVMocks.parseCSVBuffer.mockResolvedValue(mockEmails);

      const csvFile = {
        fieldname: "file",
        originalname: "emails.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 512,
        buffer: Buffer.from("user1@example.com\nuser2@example.com\nuser3@example.com"),
      };

      const result = await emailService.emailBlastService({
        target: "CUSTOM_CSV",
        subject: "Campaign Email",
        content: "Check out our offer",
        reason: "campaign",
        adminId: "admin-456",
        csvFile: csvFile as any,
      });

      expect(parseCSVMocks.parseCSVBuffer).toHaveBeenCalledWith(csvFile.buffer);
      expect(result.csvEmails).toEqual(mockEmails);
      expect(result.target).toBe("CUSTOM_CSV");
    });

    it("should throw error when target is missing", async () => {
      await expect(
        emailService.emailBlastService({
          target: "",
          subject: "Subject",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
        })
      ).rejects.toThrow("Target, subject & content, reason are required");
    });

    it("should throw error when subject is missing", async () => {
      await expect(
        emailService.emailBlastService({
          target: "SINGLE_EMAIL",
          subject: "",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
          singleEmail: "user@example.com",
        })
      ).rejects.toThrow("Target, subject & content, reason are required");
    });

    it("should throw error when content is missing", async () => {
      await expect(
        emailService.emailBlastService({
          target: "SINGLE_EMAIL",
          subject: "Subject",
          content: "",
          reason: "test",
          adminId: "admin-123",
          singleEmail: "user@example.com",
        })
      ).rejects.toThrow("Target, subject & content, reason are required");
    });

    it("should throw error when reason is missing", async () => {
      await expect(
        emailService.emailBlastService({
          target: "SINGLE_EMAIL",
          subject: "Subject",
          content: "Content",
          reason: "",
          adminId: "admin-123",
          singleEmail: "user@example.com",
        })
      ).rejects.toThrow("Target, subject & content, reason are required");
    });

    it("should throw error when SINGLE_EMAIL target but email not provided", async () => {
      await expect(
        emailService.emailBlastService({
          target: "SINGLE_EMAIL",
          subject: "Subject",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
        })
      ).rejects.toThrow("Single email is required for SINGLE_EMAIL target");
    });

    it("should throw error when CUSTOM_CSV target but CSV file not provided", async () => {
      await expect(
        emailService.emailBlastService({
          target: "CUSTOM_CSV",
          subject: "Subject",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
        })
      ).rejects.toThrow("CSV file is required for CUSTOM_CSV target");
    });

    it("should throw error when CSV file is empty", async () => {
      parseCSVMocks.parseCSVBuffer.mockResolvedValue([]);

      const csvFile = {
        fieldname: "file",
        originalname: "empty.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 0,
        buffer: Buffer.from(""),
      };

      await expect(
        emailService.emailBlastService({
          target: "CUSTOM_CSV",
          subject: "Subject",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
          csvFile: csvFile as any,
        })
      ).rejects.toThrow("No valid emails found in CSV");
    });

    it("should throw ApiError with 500 status on unexpected error", async () => {
      parseCSVMocks.parseCSVBuffer.mockRejectedValue(new Error("CSV parsing failed"));

      const csvFile = {
        fieldname: "file",
        originalname: "emails.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 512,
        buffer: Buffer.from("invalid csv"),
      };

      try {
        await emailService.emailBlastService({
          target: "CUSTOM_CSV",
          subject: "Subject",
          content: "Content",
          reason: "test",
          adminId: "admin-123",
          csvFile: csvFile as any,
        });
      } catch (error) {
        expect(error instanceof ApiError).toBe(true);
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it("should support ALL_USERS target", async () => {
      const result = await emailService.emailBlastService({
        target: "ALL_USERS",
        subject: "System Announcement",
        content: "Important update",
        reason: "announcement",
        adminId: "admin-123",
      });

      expect(result.target).toBe("ALL_USERS");
      expect(result.csvEmails).toEqual([]);
    });
  });
});

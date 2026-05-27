import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { emailController } from "./email.controller";
import { emailService } from "./email.service";
import ApiError from "../../../shared/utils/ApiError";

vi.mock("./email.service");
vi.mock("../../../infrastructure/queues", () => ({
  emailBlastQueue: {
    add: vi.fn(),
  },
}));
vi.mock("../../../shared/utils/ApiResponse");

describe("Email Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: undefined,
      user: { id: "admin-123" },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("emailBlast", () => {
    it("should initiate email blast successfully", async () => {
      const { emailBlastQueue } = await import("../../../infrastructure/queues");
      const mockPayload = {
        target: "SINGLE_EMAIL",
        subject: "Test Email",
        content: "Test Content",
        reason: "test",
        adminId: "admin-123",
        singleEmail: "user@example.com",
      };

      (emailService.emailBlastService as any).mockResolvedValue(mockPayload);
      (emailBlastQueue.add as any).mockResolvedValue({ id: "job-123" });

      mockReq.body = {
        target: "SINGLE_EMAIL",
        subject: "Test Email",
        content: "Test Content",
        reason: "test",
        singleEmail: "user@example.com",
      };

      await emailController.emailBlast(mockReq as Request, mockRes as Response);

      expect(emailService.emailBlastService).toHaveBeenCalledWith({
        target: "SINGLE_EMAIL",
        subject: "Test Email",
        content: "Test Content",
        reason: "test",
        adminId: "admin-123",
        csvFile: undefined,
        singleEmail: "user@example.com",
      });
      expect(emailBlastQueue.add).toHaveBeenCalledWith("email-blast", mockPayload);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle email blast with CSV file", async () => {
      const { emailBlastQueue } = await import("../../../infrastructure/queues");
      const mockFile = {
        fieldname: "file",
        originalname: "emails.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 1024,
        buffer: Buffer.from("email@example.com\nuser@example.com"),
      };

      const mockPayload = {
        target: "CUSTOM_CSV",
        subject: "CSV Email",
        content: "Content",
        reason: "campaign",
        adminId: "admin-123",
        csvEmails: ["email@example.com", "user@example.com"],
      };

      (emailService.emailBlastService as any).mockResolvedValue(mockPayload);
      (emailBlastQueue.add as any).mockResolvedValue({ id: "job-456" });

      mockReq.body = {
        target: "CUSTOM_CSV",
        subject: "CSV Email",
        content: "Content",
        reason: "campaign",
      };
      mockReq.file = mockFile as any;

      await emailController.emailBlast(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(400, "Invalid email address");
      (emailService.emailBlastService as any).mockRejectedValue(apiError);

      mockReq.body = {
        target: "SINGLE_EMAIL",
        subject: "Test",
        content: "Test",
        reason: "test",
        singleEmail: "invalid-email",
      };

      await emailController.emailBlast(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle generic errors", async () => {
      (emailService.emailBlastService as any).mockRejectedValue(new Error("Service error"));

      mockReq.body = {
        target: "SINGLE_EMAIL",
        subject: "Test",
        content: "Test",
        reason: "test",
        singleEmail: "user@example.com",
      };

      await emailController.emailBlast(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

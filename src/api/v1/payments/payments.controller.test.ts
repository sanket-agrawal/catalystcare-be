import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { paymentController } from "./payments.controller";
import { paymentService } from "./payments.service";
import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";

vi.mock("./payments.service");
vi.mock("../../../shared/utils/ApiResponse");

describe("Payments Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {},
      user: {
        id: "user-client-1",
        email: "client@example.com",
        firstName: "Client",
        lastName: "User",
        role: "CLIENT",
        clientProfileId: "client-profile-1",
      },
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

  describe("createOrder", () => {
    it("should successfully create an order for a client", async () => {
      const mockOrder = { id: "order-1", amount: 50000 };
      (paymentService.createOrderService as any).mockResolvedValue(mockOrder);

      mockReq.body = { slotId: "slot-1" };

      await paymentController.createOrder(mockReq as Request, mockRes as Response);

      expect(paymentService.createOrderService).toHaveBeenCalledWith("client-profile-1", "slot-1");
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(ApiResponse).toHaveBeenCalledWith(true, 201, "Order Created Sucessfully", mockOrder);
    });

    it("should throw a 403 ApiError if user is not a CLIENT", async () => {
      mockReq.user.role = "THERAPIST";

      await paymentController.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        403,
        "Only clients can book therapy sessions"
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(404, "Slot not found");
      (paymentService.createOrderService as any).mockRejectedValue(apiError);

      mockReq.body = { slotId: "slot-1" };

      await paymentController.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(ApiResponse).toHaveBeenCalledWith(false, 404, "Slot not found");
    });

    it("should handle generic errors", async () => {
      (paymentService.createOrderService as any).mockRejectedValue(
        new Error("Unexpected Razorpay error")
      );

      mockReq.body = { slotId: "slot-1" };

      await paymentController.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Something went wrong");
    });
  });

  describe("verifyPayment", () => {
    it("should verify payment successfully", async () => {
      const mockVerifyResult = { bookingId: "booking-1", success: true };
      (paymentService.verifyPaymentService as any).mockResolvedValue(mockVerifyResult);

      mockReq.body = {
        razorpay_order_id: "order-1",
        razorpay_payment_id: "pay-1",
        razorpay_signature: "sig-1",
        bookingId: "booking-1",
      };

      await paymentController.verifyPayment(mockReq as Request, mockRes as Response);

      expect(paymentService.verifyPaymentService).toHaveBeenCalledWith({
        razorpay_order_id: "order-1",
        razorpay_payment_id: "pay-1",
        razorpay_signature: "sig-1",
        bookingId: "booking-1",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        200,
        "Payment verified successfully",
        mockVerifyResult
      );
    });

    it("should return 400 ApiError when required parameters are missing", async () => {
      mockReq.body = {
        razorpay_order_id: "order-1",
        // missing other params
      };

      await paymentController.verifyPayment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        400,
        "All Razorpay parameters and bookingId are required"
      );
    });

    it("should handle ApiError from service", async () => {
      const apiError = new ApiError(400, "Invalid signature");
      (paymentService.verifyPaymentService as any).mockRejectedValue(apiError);

      mockReq.body = {
        razorpay_order_id: "order-1",
        razorpay_payment_id: "pay-1",
        razorpay_signature: "sig-1",
        bookingId: "booking-1",
      };

      await paymentController.verifyPayment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Invalid signature");
    });

    it("should handle generic errors", async () => {
      (paymentService.verifyPaymentService as any).mockRejectedValue(
        new Error("Database write error")
      );

      mockReq.body = {
        razorpay_order_id: "order-1",
        razorpay_payment_id: "pay-1",
        razorpay_signature: "sig-1",
        bookingId: "booking-1",
      };

      await paymentController.verifyPayment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Something went wrong");
    });
  });

  describe("handleWebhook", () => {
    it("should verify and process captured webhook successfully", async () => {
      (paymentService.verifyWebhookSignature as any).mockResolvedValue(true);
      (paymentService.handlePaymentCaptured as any).mockResolvedValue(true);

      mockReq.headers = { "x-razorpay-signature": "valid-sig" };
      mockReq.body = {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay-1" } } },
      };

      await paymentController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledWith(mockReq.body, "valid-sig");
      expect(paymentService.handlePaymentCaptured).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, "Webhook processed");
    });

    it("should verify and process failed webhook successfully", async () => {
      (paymentService.verifyWebhookSignature as any).mockResolvedValue(true);
      (paymentService.handlePaymentFailed as any).mockResolvedValue(true);

      mockReq.headers = { "x-razorpay-signature": "valid-sig" };
      mockReq.body = {
        event: "payment.failed",
        payload: { payment: { entity: { id: "pay-1" } } },
      };

      await paymentController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledWith(mockReq.body, "valid-sig");
      expect(paymentService.handlePaymentFailed).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, "Webhook processed");
    });

    it("should return 400 if webhook verification signature fails", async () => {
      (paymentService.verifyWebhookSignature as any).mockRejectedValue(
        new Error("Invalid webhook signature")
      );

      mockReq.headers = { "x-razorpay-signature": "invalid-sig" };
      mockReq.body = {
        event: "payment.captured",
      };

      await paymentController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Webhook verification failed");
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      (paymentService.cancelOrderService as any).mockResolvedValue(true);

      mockReq.user = { clientProfileId: "client-profile-1", role: "CLIENT" };
      mockReq.body = { bookingId: "booking-1" };

      await paymentController.cancelOrder(mockReq as Request, mockRes as Response);

      expect(paymentService.cancelOrderService).toHaveBeenCalledWith(
        "booking-1",
        "client-profile-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(true, 200, "Booking cancelled successfully");
    });

    it("should return 403 if user role is not CLIENT", async () => {
      mockReq.user = { clientProfileId: "client-profile-1", role: "THERAPIST" };
      mockReq.body = { bookingId: "booking-1" };

      await paymentController.cancelOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(ApiResponse).toHaveBeenCalledWith(
        false,
        403,
        "Only clients can cancel their bookings"
      );
    });

    it("should return 400 if bookingId is missing", async () => {
      mockReq.user = { clientProfileId: "client-profile-1", role: "CLIENT" };
      mockReq.body = {};

      await paymentController.cancelOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(ApiResponse).toHaveBeenCalledWith(false, 400, "Booking ID is required");
    });
  });
});

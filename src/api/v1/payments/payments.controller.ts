import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { Request, Response } from "express";
import { paymentService } from "./payments.service";

export const paymentController = {
  createOrder: async function (req: Request, res: Response) {
    try {
      const { clientProfileId } = req.user;
      const { slotId } = req.body;

      if (req.user.role !== "CLIENT") {
        throw new ApiError(403, "Only clients can book therapy sessions");
      }

      const order = await paymentService.createOrderService(clientProfileId, slotId);

      res.status(201).json(new ApiResponse(true, 201, "Order Created Sucessfully", order));
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  verifyPayment: async function (req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
        throw new ApiError(400, "All Razorpay parameters and bookingId are required");

      const result = await paymentService.verifyPaymentService({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
      });

      res.status(200).json(new ApiResponse(true, 200, "Payment verified successfully", result));
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError)
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      else res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
    }
  },
  handleWebhook: async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const payload = req.body;

      await paymentService.verifyWebhookSignature(payload, signature);

      // Handle payment.captured or other events
      const event = payload.event;

      if (event === "payment.captured") {
        await paymentService.handlePaymentCaptured(payload);
      } else if (event === "payment.failed") {
        await paymentService.handlePaymentFailed(payload);
      }

      res.status(200).json(new ApiResponse(true, 200, "Webhook processed"));
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(400).json(new ApiResponse(false, 400, "Webhook verification failed"));
    }
  },
  cancelOrder: async (req: Request, res: Response) => {
    try {
      const { clientProfileId } = req.user;
      const { bookingId } = req.body;

      if (req.user.role !== "CLIENT") {
        throw new ApiError(403, "Only clients can cancel their bookings");
      }

      if (!bookingId) {
        throw new ApiError(400, "Booking ID is required");
      }

      await paymentService.cancelOrderService(bookingId, clientProfileId);

      res.status(200).json(new ApiResponse(true, 200, "Booking cancelled successfully"));
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
};

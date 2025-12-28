import ApiError from "../../../shared/utils/ApiError";
import { razorpayInstance } from "../../../infrastructure/razorpay";
import { prisma } from "../../../infrastructure/prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto"
import { bookingCleanupQueue, meetingQueue } from "../../../infrastructure/queues";
import { rupeesToPaise } from "../../../shared/lib/money";
import { Prisma } from "@prisma/client";
import { slotConfig } from "../../../shared/config/slot.config";

export const paymentService = {
  createOrderService: async function (clientId: string, slotId: string) {
    try {
      // ✅ Fetch slot & therapist details
      const slot = await prisma.availabilitySlot.findUnique({
        where: { id: slotId },
        include: {
          availability: {
            include: {
              therapist: {
                select: {
                  id: true,
                  sessionFee: true,
                  currency: true,
                },
              },
            },
          },
        },
      });

      if (!slot) throw new ApiError(404, "Slot not found");
      if (slot.status !== "AVAILABLE") {
        throw new ApiError(400, "This slot is no longer available.");
      }

      const therapist = slot.availability.therapist;
    if (!therapist) throw new ApiError(404, "Therapist not found for this slot");

          const sessionFeeRupees = Number(therapist.sessionFee || 0);
          const sessionFeeDecimal = therapist.sessionFee || new Decimal(0);
      const amountPaise = rupeesToPaise(sessionFeeRupees);
      const currency = therapist.currency || "INR";

     const now = new Date();
    const commissionRate = await prisma.commissionRate.findFirst({
      where: {
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gt: now } }
        ]
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const platformPercent = Number(commissionRate?.platformPercent || 0);
      const gatewayPercent = Number(commissionRate?.gatewayPercent || 0);

      const platformFeePaise = Math.round(
        (amountPaise * platformPercent) / 100
      );
      const gatewayFeePaise = Math.round(
        (amountPaise * gatewayPercent) / 100
      );

            const payoutAmountPaise = amountPaise - platformFeePaise - gatewayFeePaise;

      const shortReceipt = `slot_${slotId.substring(0, 8)}_${Date.now()}`;

      // 1️⃣ Create Razorpay order
      const order = await razorpayInstance.orders.create({
        amount: amountPaise,
        currency,
        receipt: shortReceipt,
      });

      if (!order) throw new ApiError(400, "Unable to create Razorpay order");

      const { bookingId } = await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
        // set slot to HELD
        await tx.availabilitySlot.update({
          where: { id: slotId },
          data: { status: "HELD" },
        });

        // create payment
        const payment = await tx.payment.create({
          data: {
            razorpayOrderId: order.id,
            amount : sessionFeeDecimal,
            amountPaise,
            currency,
            status: "PENDING",

            // Commission snapshot
            commissionRateId: commissionRate?.id || null,
            platformPercent: commissionRate?.platformPercent || new Decimal(0),
            gatewayPercent: commissionRate?.gatewayPercent || new Decimal(0),
            platformFeePaise,
            gatewayFeePaise,
            payoutAmountPaise,

            feeBreakdown: {
              platformFeePaise,
              gatewayFeePaise,
              payoutAmountPaise,
            },
          },
        });

        // create booking
        const booking = await tx.booking.create({
          data: {
            clientId,
            therapistId: therapist.id,
            slotId: slot.id,
            startDateTime: slot.startDateTime,
            endDateTime: slot.endDateTime,
            status: "PENDING_PAYMENT",
            paymentStatus: "PENDING",
            isActive : true,
            payment: { connect: { id: payment.id } },
          },
        });

        return { bookingId: booking.id };
      });

      // queue cleanup
      await bookingCleanupQueue.add(
        "cancelUnpaidBooking",
        { bookingId, slotId },
        { delay: slotConfig.REGAIN_AVAILABLE_SLOTS * 60 * 1000 }
      );

      return {
        orderId: order.id,
        amount: amountPaise,
        currency,
        bookingId,
      };
    } catch (error) {
      console.error("createOrderService error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, "Internal server error during order creation");
    }
  },
  verifyPaymentService: async function (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingId: string;
  }) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = data;

      // 1️⃣ Generate expected signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      // 2️⃣ Compare signatures
      if (generatedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature — possible tampering detected");
      }

      // 3️⃣ Find payment linked to this order
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
      });

      if (!payment) throw new ApiError(404, "Payment not found for this order");

      const updated = await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            status: "CAPTURED",
            capturedAt: new Date(),
          },
        });

        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "CAPTURED", status: "CONFIRMED" },
        });

        await tx.availabilitySlot.update({
          where: { id: updatedBooking.slotId },
          data: { status: "BOOKED" },
        });

        return { updatedPayment, updatedBooking };
      });

      await meetingQueue.add(
    "create-google-meet",
    { bookingId },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 10_000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );

      return {
        success: true,
        message: "Payment verified and booking confirmed",
        ...updated
      };
    } catch (error) {
      console.error("verifyPaymentService error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, "Internal server error during payment verification");
    }
  },
  verifyWebhookSignature: async (payload: any, signature: string) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    return true;
  },

  handlePaymentCaptured: async (payload: any) => {
    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (!payment) {
      console.warn("No payment found for order", razorpayOrderId);
      return;
    }

    // ✅ Update payment + booking
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        status: "CAPTURED",
        capturedAt: new Date(),
        rawPayload: payload,
      },
    });

    // Update booking & slot
    const booking = await prisma.booking.findFirst({
      where: { payment: { id: payment.id } },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "CAPTURED", status: "CONFIRMED" },
      });

      if (booking.slotId) {
        await prisma.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: "BOOKED" },
        });
      }
    }

    console.log(`✅ Webhook: Payment ${razorpayPaymentId} captured successfully`);
  },

  handlePaymentFailed: async (payload: any) => {
    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        status: "FAILED",
        rawPayload: payload,
      },
    });

    const booking = await prisma.booking.findFirst({
      where: { payment: { id: payment.id } },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });

      if (booking.slotId) {
        await prisma.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    console.log(`❌ Webhook: Payment ${razorpayPaymentId} failed`);
  },
};

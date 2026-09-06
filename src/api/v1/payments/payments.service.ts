import ApiError from "../../../shared/utils/ApiError";
import { razorpayInstance } from "../../../infrastructure/razorpay";
import { prisma } from "../../../infrastructure/prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto";
import { bookingCleanupQueue, meetingQueue } from "../../../infrastructure/queues";
import { rupeesToPaise } from "../../../shared/lib/money";
import { Prisma } from "@prisma/client";
import { slotConfig } from "../../../shared/config/slot.config";
import { sendIncompleteBookingEmail } from "../../../shared/utils/booking-email";

import { clientCouponService } from "../coupons/coupon.service";
import { aiService } from "../ai/ai.service";

export const paymentService = {
  createOrderService: async function (
    clientId: string,
    slotId: string,
    couponCode?: string,
    sessionNotes?: string
  ) {
    try {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });
      if (!clientProfile) throw new ApiError(404, "Client profile not found");

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
      const originalAmountPaise = rupeesToPaise(sessionFeeRupees);
      const currency = therapist.currency || "INR";

      let finalAmountPaise = originalAmountPaise;
      let discountPaise = 0;
      let couponId: string | null = null;

      if (couponCode) {
        const couponResult = await clientCouponService.validateAndCalculateDiscount(
          { code: couponCode, purchaseType: "SINGLE", slotId },
          clientProfile.userId,
          clientId
        );
        finalAmountPaise = couponResult.finalAmountPaise;
        discountPaise = couponResult.discountPaise;
        couponId = couponResult.couponId;
      }

      const now = new Date();
      const commissionRate = await prisma.commissionRate.findFirst({
        where: {
          purchaseType: "SINGLE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        orderBy: { effectiveFrom: "desc" },
      });

      const platformPercent = Number(commissionRate?.platformPercent || 0);
      const gatewayPercent = Number(commissionRate?.gatewayPercent || 0);

      const platformFeePaise = Math.round((finalAmountPaise * platformPercent) / 100);
      const gatewayFeePaise = Math.round((finalAmountPaise * gatewayPercent) / 100);

      const payoutAmountPaise = finalAmountPaise - platformFeePaise - gatewayFeePaise;

      // 🎁 Handle 100% discount free booking
      if (finalAmountPaise === 0 && couponId) {
        const { bookingId } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.availabilitySlot.update({
            where: { id: slotId },
            data: { status: "BOOKED" },
          });

          const payment = await tx.payment.create({
            data: {
              amount: new Decimal(0),
              amountPaise: 0,
              currency,
              status: "CAPTURED",
              capturedAt: new Date(),
              commissionRateId: commissionRate?.id || null,
              platformPercent: commissionRate?.platformPercent || new Decimal(0),
              gatewayPercent: commissionRate?.gatewayPercent || new Decimal(0),
              platformFeePaise: 0,
              gatewayFeePaise: 0,
              payoutAmountPaise: 0,
            },
          });

          const booking = await tx.booking.create({
            data: {
              clientId,
              therapistId: therapist.id,
              slotId: slot.id,
              startDateTime: slot.startDateTime,
              endDateTime: slot.endDateTime,
              status: "CONFIRMED",
              paymentStatus: "CAPTURED",
              isActive: true,
              sessionNotes: sessionNotes || null,
              payment: { connect: { id: payment.id } },
            },
          });

          await tx.couponUsage.create({
            data: {
              couponId: couponId!,
              userId: clientProfile.userId,
              clientProfileId: clientId,
              paymentId: payment.id,
              discountPaise,
              originalPaise: originalAmountPaise,
              finalPaise: 0,
            },
          });

          await tx.coupon.update({
            where: { id: couponId! },
            data: { currentUsageCount: { increment: 1 } },
          });

          return { bookingId: booking.id };
        });

        aiService
          .refreshClientAiSummary(clientId)
          .catch((err) => console.error("Error refreshing AI summary on free booking:", err));

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
          isFree: true,
          bookingId,
          amount: 0,
          originalAmount: originalAmountPaise,
          discount: discountPaise,
          currency,
          message: "Booking confirmed with 100% discount coupon",
        };
      }

      const shortReceipt = `slot_${slotId.substring(0, 8)}_${Date.now()}`;

      // 1️⃣ Create Razorpay order
      const order = await razorpayInstance.orders.create({
        amount: finalAmountPaise,
        currency,
        receipt: shortReceipt,
      });

      if (!order) throw new ApiError(400, "Unable to create Razorpay order");

      const { bookingId } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // set slot to HELD
        await tx.availabilitySlot.update({
          where: { id: slotId },
          data: { status: "HELD" },
        });

        // create payment
        const payment = await tx.payment.create({
          data: {
            razorpayOrderId: order.id,
            amount: new Decimal(finalAmountPaise / 100),
            amountPaise: finalAmountPaise,
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
            isActive: true,
            sessionNotes: sessionNotes || null,
            payment: { connect: { id: payment.id } },
          },
        });

        if (couponId) {
          await tx.couponUsage.create({
            data: {
              couponId,
              userId: clientProfile.userId,
              clientProfileId: clientId,
              paymentId: payment.id,
              discountPaise,
              originalPaise: originalAmountPaise,
              finalPaise: finalAmountPaise,
            },
          });

          await tx.coupon.update({
            where: { id: couponId },
            data: { currentUsageCount: { increment: 1 } },
          });
        }

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
        amount: finalAmountPaise,
        originalAmount: originalAmountPaise,
        discount: discountPaise,
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
    sessionNotes?: string;
  }) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
        sessionNotes,
      } = data;

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

      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          data: {
            paymentStatus: "CAPTURED",
            status: "CONFIRMED",
            ...(sessionNotes ? { sessionNotes } : {}),
          },
        });

        await tx.availabilitySlot.update({
          where: { id: updatedBooking.slotId },
          data: { status: "BOOKED" },
        });

        return { updatedPayment, updatedBooking };
      });

      aiService
        .refreshClientAiSummary(updated.updatedBooking.clientId)
        .catch((err) => console.error("Error refreshing AI summary on payment verification:", err));

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

      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: updated.updatedBooking.clientId },
        select: { userId: true },
      });

      const existingAssessment = clientProfile?.userId
        ? await prisma.clientAssesment.findFirst({
            where: { userId: clientProfile.userId },
            select: { id: true },
          })
        : null;

      const isFirstBooking = !existingAssessment;

      const questionnaire = [
        {
          id: "recentFeeling",
          question: "How have you been feeling recently?",
          category: "Mood Disorders",
        },
        {
          id: "crowdedWithWorries",
          question: "Do you often feel crowded with worries?",
          category: "Anxiety Disorders",
        },
        {
          id: "roomFullWithPeople",
          question: "How do you feel in a room full of people?",
          category: "Anxiety Disorders",
        },
        {
          id: "dailyTaskFeeling",
          question: "How do you feel about your daily tasks?",
          category: "Mood Disorders",
        },
        {
          id: "thoughtEcho",
          question: "Do you experience thoughts echoing or repeating in your mind?",
          category: "Mood Disorders",
        },
        {
          id: "decision",
          question: "How do you make decisions or handle overthinking?",
          category: "Cognitive / Personality",
        },
        {
          id: "oldMemories",
          question: "Do old memories or triggers affect your current state?",
          category: "Trauma & Stress",
        },
        {
          id: "lossOrSeperation",
          question: "Have you recently experienced loss or separation?",
          category: "Trauma & Stress",
        },
        {
          id: "closestRelationShip",
          question: "How would you describe your closest relationships?",
          category: "Personality / Relationship Issues",
        },
        {
          id: "sayingNo",
          question: "Do you find it difficult to say no or set boundaries?",
          category: "Personality / Relationship Issues",
        },
        {
          id: "nightSleep",
          question: "How is your night sleep pattern?",
          category: "Lifestyle & Habits",
        },
        {
          id: "eatingPattern",
          question: "How is your eating pattern or appetite?",
          category: "Lifestyle & Habits",
        },
        {
          id: "heavyLifeCope",
          question: "How do you cope with heavy life situations or stress?",
          category: "Lifestyle & Habits",
        },
        {
          id: "technologyView",
          question: "How does technology usage affect your daily life?",
          category: "Lifestyle & Habits",
        },
        {
          id: "selfImage",
          question: "How do you view yourself or your self-image?",
          category: "Personality / Self",
        },
        {
          id: "futurePerspective",
          question: "What is your perspective on the future?",
          category: "Mood Disorders / Self",
        },
        {
          id: "sucidalThoughts",
          question: "Do you have any suicidal thoughts?",
          category: "Red Flag Concerns",
        },
        {
          id: "halucinations",
          question: "Have you experienced any hallucinations?",
          category: "Red Flag Concerns",
        },
        {
          id: "selfHarm",
          question: "Have you had thoughts of self-harm?",
          category: "Red Flag Concerns",
        },
      ];

      return {
        success: true,
        message: "Payment verified and booking confirmed",
        isFirstBooking,
        ...(isFirstBooking ? { questionnaire } : {}),
        ...updated,
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

      aiService
        .refreshClientAiSummary(booking.clientId)
        .catch((err) => console.error("Error refreshing AI summary on webhook capture:", err));
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

    if (booking && booking.status === "PENDING_PAYMENT") {
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

      await sendIncompleteBookingEmail(booking.id);
    }

    console.log(`❌ Webhook: Payment ${razorpayPaymentId} failed`);
  },

  cancelOrderService: async function (bookingId: string, clientId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.clientId !== clientId) {
      throw new ApiError(403, "Unauthorized to cancel this booking");
    }

    if (booking.status !== "PENDING_PAYMENT") {
      throw new ApiError(400, "Only pending bookings can be cancelled");
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
          isActive: false,
          cancelledAt: new Date(),
          cancellationReason: "Cancelled by user during checkout",
        },
      });

      if (booking.payment) {
        const usage = await tx.couponUsage.findUnique({
          where: { paymentId: booking.payment.id },
        });

        if (usage) {
          await tx.couponUsage.delete({ where: { id: usage.id } });
          await tx.coupon.update({
            where: { id: usage.couponId },
            data: { currentUsageCount: { decrement: 1 } },
          });
        }

        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "FAILED" },
        });
      }

      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: "AVAILABLE" },
      });
    });

    await sendIncompleteBookingEmail(bookingId);
  },
};

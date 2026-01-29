import ApiError from "../../../../shared/utils/ApiError";
import {prisma} from "../../../../infrastructure/prisma/client"
import { razorpayInstance } from "../../../../infrastructure/razorpay";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { emailQueue } from "../../../../infrastructure/queues";
import { emailFromAddress, emailSubjects } from "../../../../shared/config/email.config";
import { clientProgramBookingConfirmationTemplate, therapistProgramBookingConfirmationTemplate } from "../../../../shared/email-templates/programBooking";
import { calculateProgramComissions } from "../../../../shared/lib/money";

type verifyPaymentType = {
   razorpay_order_id : string,
    razorpay_payment_id : string,
    razorpay_signature : string,
    paymentId : string,
    clientId :string,
}

const ProgramPaymentService = {
 createProgramBookingOrder : async (clientId : string, planId :string) => {
   const plan = await prisma.programPlan.findFirst({
      where: { id: planId, isActive: true },
      include: { program: true },
    });

    if (!plan) throw new ApiError(404, "Program plan not found");

    const now = new Date();

    const commissionRate = await prisma.commissionRate.findFirst({
          where: {
            purchaseType : "PROGRAM",
            effectiveFrom: { lte: now },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gt: now } }
            ]
          },
          orderBy: { effectiveFrom: 'desc' },
        });

        const commission = calculateProgramComissions({
    amountPaise: plan.pricePaise,
    commissionRate: commissionRate
      ? {
          id: commissionRate.id,
          platformPercent: Number(commissionRate.platformPercent),
          gatewayPercent: Number(commissionRate.gatewayPercent),
        }
      : null,
  });


      const shortReceipt = `program_${planId.substring(0, 8)}_${Date.now()}`;

    const order = await razorpayInstance.orders.create({
      amount: plan.pricePaise,
      currency: plan.currency,
      receipt: shortReceipt,
    });

    const payment = await prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amountPaise: plan.pricePaise,
        amount: plan.price,
        currency: plan.currency,
        programPlanId: plan.id,
        bookingType : "PROGRAM",
        status: "PENDING",
        ...commission
      },
    });

    return {
      orderId: order.id,
      amount: plan.pricePaise,
      currency: plan.currency,
      paymentId: payment.id,
    };
 },
 verifyPayment: async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    paymentId,
    clientId,
  }: verifyPaymentType) => {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }

    const response =  prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          status: "CAPTURED",
          capturedAt: new Date(),
        },
      });

      const plan = await tx.programPlan.findFirst({
        where: { id: payment.programPlanId!},
        include: { program: true },
      });


      if (!plan) throw new ApiError(500, "Program plan missing");

      const purchase = await tx.programPurchase.create({
        data: {
          clientId,
          therapistId: plan.program.therapistId,
          programId: plan.programId,
          programPlanId: plan.id,
          totalSessions: plan.sessionsCount,
        },
        include : {
         client : {
            include : {
               user : true
            }
         },
         therapist : {
            include : {
               user : true
            }
         }
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { programPurchaseId: purchase.id },
      });

        await emailQueue.add("programBookingConfirmationClient", {
          to: purchase.client.user.email,
          subject: emailSubjects(undefined,undefined,undefined ,plan.program.title,plan.name).clientProgramBookingConfirmation,
          html: clientProgramBookingConfirmationTemplate(
            purchase.client.user.firstName,
            purchase.therapist.user.firstName+" "+purchase.therapist.user.lastName,
            plan.name,
            plan.program.title,
          ),
          sender: emailFromAddress().infoEmail,
        });

        await emailQueue.add("programBookingConfirmationTherapist", {
          to: purchase.therapist.user.email,
          subject: emailSubjects(undefined,undefined,undefined,plan.program.title,plan.name).therapistProgramBookingConfirmaton,
          html: therapistProgramBookingConfirmationTemplate(
            purchase.therapist.user.firstName,
            purchase.client.user.firstName+" "+purchase.client.user.lastName,
            plan.name,
            plan.program.title,
          ),
          sender: emailFromAddress().infoEmail,
        });

      return purchase;
    });

    return response;
  },
};

export default ProgramPaymentService;
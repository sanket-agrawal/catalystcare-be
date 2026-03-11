import ApiError from "../../../../shared/utils/ApiError";
import {prisma} from '../../../../infrastructure/prisma/client';
import crypto from 'crypto';
import { razorpayInstance } from "../../../../infrastructure/razorpay";
import { InitiateRegistrationInput, VerifyPaymentInput, WebinarRegistrationStatus } from "./webinar.dto";
import { emailQueue } from "../../../../infrastructure/queues";
import { emailFromAddress, webinarEmailSubjects } from "../../../../shared/config/email.config";
import { clientWebinarConfirmationTemplate, therapistWebinarRegistrationTemplate } from "../../../../shared/email-templates/webinarRegistration";
// import { WebinarConfirmationJobData, webinarEmailQueue } from "../../../../infrastructure/queues/webinarEmailQueue";

export const fetchWebinarByIdService = async (webinarId : string) => {
  const webinar = await prisma.webinar.findUnique({
    where : {
      id : webinarId
    },
    select : {
      id : true,
      title : true,
      description : true,
      bannerUrl : true,
      startTime : true,
      endTime : true,
      price : true,
      currency : true,
      status : true
    }
  });

  if(!webinar || webinar.status !== "PUBLISHED"){
    throw new ApiError(404,"Webinar not found");  
  }

  return webinar;
}

export const initiateWebinarRegistrationService = async (webinarId : string, userEmail : string, userName : string  ) => {
  const webinar = await prisma.webinar.findUnique({
    where : {
      id : webinarId
    }
  });

  if(!webinar || webinar.status !== "PUBLISHED"){
    throw new ApiError(404,"Webinar not found");  
  }

    const existing = await prisma.webinarRegistration.findFirst({
    where: {
      webinarId,
      guestEmail: userEmail,
      status:     WebinarRegistrationStatus.CONFIRMED,
    },
  });
  if (existing) throw new ApiError(409,'You are already registered for this webinar')

 return handlePaidRegistration(webinar, {
    guestEmail: userEmail,
    guestName: userName,
  });
}



async function handlePaidRegistration(webinar: any, input: InitiateRegistrationInput) {
  // Clean up any stale PENDING_PAYMENT entries for this guest+webinar
  await prisma.webinarRegistration.deleteMany({
    where: {
      webinarId:  webinar.id,
      guestEmail: input.guestEmail,
      status:     WebinarRegistrationStatus.PENDING_PAYMENT,
    },
  });

  // Create Razorpay order
  const orderNotes = {
    webinarId:  webinar.id,
    guestEmail: input.guestEmail,
    guestName:  input.guestName,
  };

  const order = await razorpayInstance.orders.create({
    amount:   webinar.pricePaise,
    currency: webinar.currency ?? 'INR',
    notes:    orderNotes,
    receipt:  `wbr_${webinar.id.slice(0, 8)}_${Date.now()}`,
  });

  // Persist pending registration
  const registration = await prisma.webinarRegistration.create({
    data: {
      webinarId:       webinar.id,
      guestName:       input.guestName,
      guestEmail:      input.guestEmail,
      guestPhone:      input.guestPhone,
      status:          WebinarRegistrationStatus.PENDING_PAYMENT,
      razorpayOrderId: order.id,
      amount :          webinar.price,
      amountPaise:     webinar.pricePaise,
      currency:        webinar.currency ?? 'INR',
    },
  });

  return {
    type:           'PAID',
    registrationId: registration.id,
    razorpayOrderId: order.id,
    razorpayKeyId:   process.env.RAZORPAY_KEY_ID,
    amountPaise:     webinar.pricePaise,
    currency:        webinar.currency ?? 'INR',
    webinarTitle:    webinar.title,
    guestName:       input.guestName,
    guestEmail:      input.guestEmail,
  };
}

// ─── Paid flow — step 2: verify & confirm ────────────────────────────────────

export async function verifyWebinarPayment(input: VerifyPaymentInput) {
  // 1. Fetch registration
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: input.registrationId },
    include: {
      webinar: {
        include: {
          therapist: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });

  if (!registration) throw new ApiError(404,'Registration not found');
  if (registration.status === WebinarRegistrationStatus.CONFIRMED) {
    // Idempotent — already confirmed (e.g. webhook beat us)
    return { status: 'CONFIRMED', registrationId: registration.id };
  }
  if (registration.status !== WebinarRegistrationStatus.PENDING_PAYMENT) {
    throw new ApiError(400,'Registration is not in a payable state');
  }
  if (registration.razorpayOrderId !== input.razorpayOrderId) {
    throw new ApiError(400,'Order ID mismatch');
  }

  // 2. Verify Razorpay signature
  verifyRazorpaySignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature
  );

  // 3. Confirm in a transaction
  const webinar = registration.webinar;

  await prisma.$transaction([
    prisma.webinarRegistration.update({
      where: { id: registration.id },
      data: {
        status:            WebinarRegistrationStatus.CONFIRMED,
        razorpayPaymentId: input.razorpayPaymentId,
      },
    }),
    prisma.webinar.update({
      where: { id: webinar.id },
      data:  { registrationCount: { increment: 1 } },
    }),
  ]);


    await emailQueue.add("send-assessment-result", {
        to: registration.guestEmail,
        subject: webinarEmailSubjects(registration.webinar.title).clinetRegistrationConfirmation,
        html: clientWebinarConfirmationTemplate(
      registration.guestName,
      webinar.title,
      webinar.startTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      webinar.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      `${webinar.therapist.user.firstName} ${webinar.therapist.user.lastName}`,
      webinar.meetingLink ?? ''
    ),
        sender: emailFromAddress().infoEmail
      });

          await emailQueue.add("send-assessment-result", {
        to: registration.webinar.therapist.user.email,
        subject: webinarEmailSubjects(registration.webinar.title).therapistConfirmation,
        html: therapistWebinarRegistrationTemplate(
      registration.guestName,
      webinar.title,
      webinar.startTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      webinar.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      `${webinar.therapist.user.firstName} ${webinar.therapist.user.lastName}`,
      webinar.meetingLink ?? ''
    ),
        sender: emailFromAddress().infoEmail
      });

  // 4. Enqueue confirmation email
  // await enqueueConfirmationEmail(
  //   registration.id,
  //   webinar,
  //   { guestName: registration.guestName, guestEmail: registration.guestEmail },
  //   true,
  //   registration.amountPaise ?? 0
  // );

  // logger.info({ registrationId: registration.id }, 'Webinar payment verified and registration confirmed');

  return {
    status:         'CONFIRMED',
    registrationId: registration.id,
    message:        'Payment verified. Check your email for the invite.',
  };
}

// ─── Webhook handler (Razorpay → server-side confirmation) ───────────────────

export async function handleRazorpayWebhook(
  rawBody: Buffer,
  signature: string
) {
  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (expectedSig !== signature) {
    throw new ApiError(400,'Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString());

  if (event.event !== 'payment.captured') return { ignored: true };

  const payment = event.payload?.payment?.entity;
  if (!payment) return { ignored: true };

  const orderId = payment.order_id as string;
  if (!orderId) return { ignored: true };

  const registration = await prisma.webinarRegistration.findFirst({
    where: { razorpayOrderId: orderId },
    include: {
      webinar: {
        include: {
          therapist: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });

  if (!registration) return { ignored: true, reason: 'No matching registration' };
  if (registration.status === WebinarRegistrationStatus.CONFIRMED) return { ignored: true, reason: 'Already confirmed' };

  const webinar = registration.webinar;

  await prisma.$transaction([
    prisma.webinarRegistration.update({
      where: { id: registration.id },
      data: {
        status:            WebinarRegistrationStatus.CONFIRMED,
        razorpayPaymentId: payment.id,
      },
    }),
    prisma.webinar.update({
      where: { id: webinar.id },
      data:  { registrationCount: { increment: 1 } },
    }),
  ]);

  await enqueueConfirmationEmail(
    registration.id,
    webinar,
    { guestName: registration.guestName, guestEmail: registration.guestEmail },
    true,
    registration.amountPaise ?? 0
  );

  // logger.info({ registrationId: registration.id, orderId }, 'Webinar confirmed via webhook');
  return { processed: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): void {
  const body   = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    throw new ApiError(400,'Payment signature verification failed');
  }
}

async function enqueueConfirmationEmail(
  registrationId: string,
  webinar: any,
  guest: { guestName: string; guestEmail: string },
  isPaid: boolean,
  amountPaise: number
) {
  const therapist = webinar.therapist;
  const therapistName  = `${therapist.user.firstName} ${therapist.user.lastName}`;
  const therapistEmail = therapist.googleEmail ?? therapist.user.email;

  const jobData = {
    registrationId,
    guestEmail:     guest.guestEmail,
    guestName:      guest.guestName,
    webinarId:      webinar.id,
    webinarTitle:   webinar.title,
    webinarDesc:    webinar.description ?? '',
    startTime:      webinar.startTime.toISOString(),
    endTime:        webinar.endTime.toISOString(),
    meetingLink:    webinar.meetingLink ?? '',
    therapistName,
    therapistEmail,
    isPaid,
    amountPaise,
  };

  const job = await webinarEmailQueue.add(
    `confirmation-${registrationId}`,
    jobData,
    {
      jobId: `confirmation-${registrationId}`, // deduplication
      delay: 0,
    }
  );

  // Store job ID for traceability
  await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data:  { confirmationJobId: job.id },
  });
}
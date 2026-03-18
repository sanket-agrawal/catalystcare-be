import { createGoogleMeet } from "../../../../infrastructure/google/meeting.generator";
import {prisma} from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import { CreateWebinarDTO, UpdateWebinarDTO, WebinarStatus } from "./webinar.types";

class WebinarService {

  // 1️⃣ CREATE
  static async createWebinar(therapistId: string, data: CreateWebinarDTO) {

    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: { status: true }
    });

    if(!therapist){
      throw new ApiError(404, "Therapist profile not found");
    }

    if (therapist.status !== "APPROVED") {
      throw new ApiError(403, "Only approved therapists can create webinars");
    }

    if (new Date(data.startTime) >= new Date(data.endTime)) {
  throw new ApiError(400, "End time must be after start time");
}

// 2. Must be in future (optional but good guard)
if (new Date(data.startTime) <= new Date()) {
  throw new ApiError(400, "Webinar must be scheduled in the future");
}

// 3. Minimum 24-hour constraint
const minAllowedStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
if (new Date(data.startTime) < minAllowedStart) {
  throw new ApiError(
    400,
    "Webinar must be scheduled at least 24 hours in advance"
  );
}

    const bookings = await prisma.booking.findMany({
      where: {
        therapistId,
        startDateTime: { lt: data.endTime },
        endDateTime: { gt: data.startTime }
      }
    });

    if (bookings.length > 0) {
      throw new ApiError(400, "Webinar time conflicts with existing bookings");
    }

    
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new ApiError(400, "End time must be after start time");
    }


    const { meetLink , provider } = await createGoogleMeet({
      therapistId,
      startTime : data.startTime,
      endTime : data.endTime,
      webinarTitle : data.title,
      webinarDescription : data.description ? data.description : ""
    })

    const webinar = await prisma.webinar.create({
      data: {
        therapistId,
        ...data,
        status: WebinarStatus.DRAFT,
        isPaid : true,
        timezone : "IST",
        pricePaise : data.price * 100,
        currency : "INR",
        meetingProvider : provider,
        meetingLink : meetLink
      }
    });

    return data;
  }

  // 2️⃣ FETCH ALL (Therapist specific)
static async fetchAll(therapistId: string) {
  const webinars = await prisma.webinar.findMany({
    where: { therapistId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      price: true,
      currency: true,
      startTime: true,
      endTime: true,
      timezone: true,
      meetingLink: true,
      registrationCount : true
    }
  });

  const now = new Date();

  return webinars.map((webinar) => {
    const showTime = new Date(webinar.startTime.getTime() - 15 * 60 * 1000);

    return {
      ...webinar,
      meetingLink: webinar.status === 'PUBLISHED' ? ( now >= showTime ? webinar.meetingLink : null) : null,
      registrationCount : webinar.status === 'PUBLISHED' ? webinar.registrationCount : null
      
    };
  });
}
  // 3️⃣ FETCH BY ID
  static async fetchById(therapistId: string, webinarId: string) {

    const webinar = await prisma.webinar.findFirst({
      where: {
        id: webinarId,
        therapistId
      },
      select : {
        id: true,
      title: true,
      description: true,
      status: true,
      price: true,
      currency: true,
      startTime: true,
      endTime: true,
      timezone: true,
      meetingLink: true,
      registrationCount : true
      }
    });

    if (!webinar)
      throw new ApiError(404, "Webinar not found");
      const now = new Date();


    const showTime = new Date(webinar.startTime.getTime() - 15 * 60 * 1000);

    return {
      ...webinar,
      meetingLink:  webinar.status === 'PUBLISHED' ? ( now >= showTime ? webinar.meetingLink : null) : null,
      registrationCount : webinar.status === 'PUBLISHED' ? webinar.registrationCount : null
    };
  }

  // 4️⃣ UPDATE
  static async updateWebinar(
    therapistId: string,
    webinarId: string,
    data: UpdateWebinarDTO
  ) {

    const webinar = await this.fetchById(therapistId, webinarId);

    if (webinar.status === WebinarStatus.PUBLISHED) {
      throw new ApiError(400, "Cannot edit a published webinar");
    }

    return prisma.webinar.update({
      where: { id: webinarId },
      data,
      select : {
         id: true,
      title: true,
      description: true,
      status: true,
      price: true,
      currency: true,
      startTime: true,
      endTime: true,
      timezone: true,
      registrationCount : true
      }
    });
  }

  // 5️⃣ PUBLISH
  static async publishWebinar(therapistId: string, webinarId: string) {

    const webinar = await this.fetchById(therapistId, webinarId);

    if (!webinar.title || !webinar.startTime || !webinar.endTime) {
      throw new ApiError(400, "Incomplete webinar details");
    }

    return prisma.webinar.update({
      where: { id: webinarId },
      data: {
        status: WebinarStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  }

  // 6️⃣ UNPUBLISH
  static async unpublishWebinar(therapistId: string, webinarId: string) {

    const webinar = await this.fetchById(therapistId, webinarId);

    if (webinar.status !== WebinarStatus.PUBLISHED)
      throw new ApiError(400, "Webinar is not published");

    return prisma.webinar.update({
      where: { id: webinarId },
      data: {
        status: WebinarStatus.DRAFT,
        publishedAt: null
      }
    });
  }

static async fetchWebinarRegistrations(therapistId: string) {

  const [registrations, billingTotals] = await Promise.all([

    prisma.webinarRegistration.findMany({
      where: {
        webinar: { therapistId },
        status: "CONFIRMED"
      },
      include: {
        webinar: {
          select: {
            id: true,
            price: true,
            currency: true,
            title: true,
            startTime: true,
            endTime: true,
            meetingLink: true,
            therapist: {
              include: { user: true }
            }
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amountPaise: true,
            currency: true,

            platformPercent: true,
            gatewayPercent: true,

            platformFeePaise: true,
            gatewayFeePaise: true,
            payoutAmountPaise: true,

            capturedAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),

    prisma.payment.aggregate({
      where: {
        webinarRegistration: {
          webinar: {
            therapistId
          }
        },
        status: "CAPTURED"
      },
      _sum: {
        amountPaise: true,
        platformFeePaise: true,
        gatewayFeePaise: true,
        payoutAmountPaise: true
      }
    })

  ]);

  const formattedRegistrations = registrations.map(reg => {

    const payment = reg.payment;

    return {
      id: reg.id,

      webinar: {
        id: reg.webinar.id,
        title: reg.webinar.title,
        price: reg.webinar.price,
        currency: reg.webinar.currency,
        startTime: reg.webinar.startTime,
        endTime: reg.webinar.endTime
      },

      guest: {
        name: reg.guestName,
        email: reg.guestEmail,
        phone: reg.guestPhone
      },

      billing: payment ? {
        paymentId: payment.id,
        status: payment.status,

        amountPaise: payment.amountPaise,

        commissions: {
          platformPercent: payment.platformPercent,
          gatewayPercent: payment.gatewayPercent,
          platformFeePaise: payment.platformFeePaise,
          gatewayFeePaise: payment.gatewayFeePaise
        },

        payoutAmountPaise: payment.payoutAmountPaise,

        capturedAt: payment.capturedAt
      } : null,

      registeredAt: reg.createdAt
    };

  });

  return {
    totals: {
      totalRevenue: billingTotals._sum.amountPaise ?? 0,
      totalPlatformFees: billingTotals._sum.platformFeePaise ?? 0,
      totalGatewayFees: billingTotals._sum.gatewayFeePaise ?? 0,
      totalPayout: billingTotals._sum.payoutAmountPaise ?? 0
    },

    registrations: formattedRegistrations
  };

}

   
}

export default WebinarService;
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
}

export default WebinarService;
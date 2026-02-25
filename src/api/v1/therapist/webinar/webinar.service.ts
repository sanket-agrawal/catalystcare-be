import {prisma} from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import { CreateWebinarDTO, UpdateWebinarDTO, WebinarStatus } from "./webinar.types";

class WebinarService {

  // 1️⃣ CREATE
  static async createWebinar(therapistId: string, data: CreateWebinarDTO) {

    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new ApiError(400, "End time must be after start time");
    }

    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: { status: true }
    });

    if (therapist?.status !== "APPROVED") {
      throw new ApiError(403, "Only approved therapists can create webinars");
    }

    // const webinar = await prisma.webinar.create({
    //   data: {
    //     therapistId,
    //     ...data,
    //     status: WebinarStatus.DRAFT
    //   }
    // });

    // return webinar;
  }

  // 2️⃣ FETCH ALL (Therapist specific)
  static async fetchAll(therapistId: string) {
    return prisma.webinar.findMany({
      where: { therapistId },
      orderBy: { createdAt: "desc" }
    });
  }

  // 3️⃣ FETCH BY ID
  static async fetchById(therapistId: string, webinarId: string) {

    const webinar = await prisma.webinar.findFirst({
      where: {
        id: webinarId,
        therapistId
      }
    });

    if (!webinar)
      throw new ApiError(404, "Webinar not found");

    return webinar;
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
      data
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
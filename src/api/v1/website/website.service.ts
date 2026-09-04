import ApiError from "../../../shared/utils/ApiError";
import { prisma } from "../../../infrastructure/prisma/client";
import { serverConfig } from "../../../shared/config/server.config";
import { DateTime } from "luxon";
import {
  AvailabilitySlotType,
  ProcessedSlot,
  SlotGroupByDate,
  SlotNotificationRequestPayload,
} from "./website.dto";
import { frontendConfig } from "../../../shared/config/frontend.config";
import { GroupedSlots } from "../therapist/availability/availability.service";
import { emailSubjects, emailFromAddress } from "../../../shared/config/email.config";
import { emailQueue } from "../../../infrastructure/queues";
import {
  slotNotificationTherapistTemplate,
  slotNotificationUserTemplate,
} from "../../../shared/email-templates/website";

export const getAllCategories = async () => {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        iconUrl: true,
        websiteDesc: true,
        subCategories: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            iconUrl: true,
            tagline: true,
            websiteDesc: true,
          },
        },
      },
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching categories");
  }
};

export const fetchTherapistProfileService = async (categoryId: string, subCategoryId: string) => {
  try {
    return await prisma.user.findMany({
      where: {
        therapistProfile: {
          status: "APPROVED",
          slug: { not: null },
        },
      },
      select: {
        firstName: true,
        lastName: true,
        profilePhoto: true,
        therapistProfile: {
          select: {
            slug: true,
            sessionFee: true,
            languageSpoken: true,
            yearOfExperience: true,
            categories: {
              select: {
                slug: true,
                name: true,
              },
            },
            subCategories: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.message);
    }
    throw error;
  }
};

export const fetchCategoryBySlugService = async (categorySlug: string) => {
  try {
    return await prisma.category.findFirst({
      where: {
        slug: categorySlug,
      },
      select: {
        slug: true,
        name: true,
        description: true,
        iconUrl: true,
        tagline: true,
        subCategories: {
          select: {
            slug: true,
            name: true,
            description: true,
            iconUrl: true,
            tagline: true,
          },
        },
        therapists: {
          where: {
            status: "APPROVED",
          },
          select: {
            slug: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching categories");
  }
};

export const fetchTherapistBySlugService = async (therapistSlug: string) => {
  try {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const now = new Date();
    // ---------- FETCH THERAPIST BASIC DETAILS ----------
    const therapist = await prisma.therapistProfile.findFirst({
      where: {
        slug: therapistSlug,
        status: "APPROVED",
        user: { isEmailVerified: true },
      },
      select: {
        id: true,
        slug: true,
        about: true,
        yearOfExperience: true,
        languageSpoken: true,
        sessionFee: true,
        professionalTitle: true,
        highestQualification: true,
        graduationYear: true,
        licenseNumber: true,
        licensingAuthority: true,
        categories: { select: { slug: true, name: true } },
        subCategories: { select: { slug: true, name: true } },
        user: { select: { firstName: true, lastName: true, profilePhoto: true } },
        testimonials: {
          where: {
            status: "APPROVED",
          },
          select: {
            text: true,
            rating: true,
          },
        },

        // 🔥 RETURN ONLY FUTURE SLOTS FROM NOW
        slots: {
          where: {
            status: "AVAILABLE",
            startDateTime: {
              gte: now,
            },
          },
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true,
            status: true,
          },
          orderBy: { startDateTime: "asc" },
        },

        programs: {
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            outcome: true,

            plans: {
              orderBy: { updatedAt: "desc" },
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                sessionsCount: true,
                sessionDuration: true,
                price: true,
                currency: true,
                cadence: true,
                recommendedGapDays: true,
              },
            },
          },
        },

        webinars: {
          where: {
            status: "PUBLISHED",
            startTime: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            bannerUrl: true,
            startTime: true,
            endTime: true,
            timezone: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new ApiError(404, "Therapist not found");
    }

    // ---------- GROUP SLOTS BY IST DATE ----------
    const grouped: Record<string, any[]> = {};

    for (const s of therapist.slots) {
      const startIST = DateTime.fromJSDate(s.startDateTime, { zone: "utc" }).setZone(
        "Asia/Kolkata"
      );

      const endIST = DateTime.fromJSDate(s.endDateTime, { zone: "utc" }).setZone("Asia/Kolkata");

      const dayKey = startIST.toFormat("yyyy-MM-dd");

      if (!grouped[dayKey]) grouped[dayKey] = [];

      grouped[dayKey].push({
        id: s.id,
        startTime: startIST.toFormat("HH:mm"),
        endTime: endIST.toFormat("HH:mm"),
        status: s.status,
        startDateTimeIST: startIST.toISO()!,
        endDateTimeIST: endIST.toISO()!,
      });
    }

    // ---------- AVERAGE RATING ----------
    const ratings = therapist.testimonials.map((t: { rating: number }) => t.rating);

    const averageRating =
      ratings.length > 0
        ? parseFloat(
            (ratings.reduce((acc: number, r: number) => acc + r, 0) / ratings.length).toFixed(1)
          )
        : null;

    return {
      slug: therapist.slug,
      about: therapist.about,
      yearOfExperience: therapist.yearOfExperience,
      languageSpoken: therapist.languageSpoken,
      sessionFee: therapist.sessionFee,
      user: therapist.user,
      categories: therapist.categories,
      subCategories: therapist.subCategories,
      testimonials: therapist.testimonials,
      slots: grouped, // grouped IST slots
      hasAvailableSlots: therapist.slots.length > 0,
      averageRating,
      totalReviews: ratings.length,
      shareUrl: `${frontendConfig.therapistProfilePage}/${therapist.slug}`,
      programs: therapist.programs,
      webinars: therapist.webinars,
      professionalTitle: therapist.professionalTitle,
      highestQualification: therapist.highestQualification,
      graduationYear: therapist.graduationYear,
      licenseNumber: therapist.licenseNumber,
      licensingAuthority: therapist.licensingAuthority,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, (error as Error).message);
  }
};

export const createSlotNotificationRequestService = async (
  payload: SlotNotificationRequestPayload
) => {
  try {
    const { therapistId, therapistSlug, userId } = payload;

    if (!userId) {
      throw new ApiError(401, "User authentication required to request slot notifications");
    }

    if (!therapistId && !therapistSlug) {
      throw new ApiError(400, "Therapist ID or Therapist Slug is required");
    }

    const therapist = await prisma.therapistProfile.findFirst({
      where: {
        status: "APPROVED",
        ...(therapistId ? { id: therapistId } : { slug: therapistSlug }),
      },
      select: {
        id: true,
        slug: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new ApiError(404, "Therapist profile not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, "User profile not found");
    }

    const userEmail = user.email;
    const userName = `${user.firstName} ${user.lastName}`.trim();

    const existingRequest = await prisma.slotNotificationRequest.findFirst({
      where: {
        therapistId: therapist.id,
        userId: user.id,
        isNotified: false,
      },
    });

    let notificationRequest;
    if (existingRequest) {
      notificationRequest = await prisma.slotNotificationRequest.update({
        where: { id: existingRequest.id },
        data: {
          createdAt: new Date(),
        },
      });
    } else {
      notificationRequest = await prisma.slotNotificationRequest.create({
        data: {
          therapistId: therapist.id,
          userId: user.id,
          isNotified: false,
        },
      });
    }

    const therapistFullName = `${therapist.user.firstName} ${therapist.user.lastName}`.trim();
    await emailQueue.add("sendSlotNotificationTherapistAlert", {
      to: therapist.user.email,
      subject: emailSubjects(therapistFullName).slotNotificationTherapistAlert,
      html: slotNotificationTherapistTemplate(therapistFullName, userEmail, userName),
      sender: emailFromAddress().infoEmail,
    });

    return {
      message: "Notification request created successfully. Therapist has been notified.",
      request: notificationRequest,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, (error as Error).message || "Error creating slot notification request");
  }
};

export const notifyPendingSlotSubscribersService = async (therapistId: string) => {
  try {
    const pendingRequests = await prisma.slotNotificationRequest.findMany({
      where: {
        therapistId,
        isNotified: false,
      },
      include: {
        therapist: {
          select: {
            slug: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!pendingRequests || pendingRequests.length === 0) {
      return { notifiedCount: 0 };
    }

    const therapist = pendingRequests[0].therapist;
    const therapistName = `${therapist.user.firstName} ${therapist.user.lastName}`.trim();
    const therapistSlug = therapist.slug || therapistId;

    for (const req of pendingRequests) {
      const recipientEmail = req.user.email;
      if (!recipientEmail) continue;

      const recipientName = `${req.user.firstName} ${req.user.lastName}`.trim();

      await emailQueue.add("sendSlotNotificationUserAvailable", {
        to: recipientEmail,
        subject: emailSubjects(therapistName).slotNotificationUserAvailable,
        html: slotNotificationUserTemplate(recipientName, therapistName, therapistSlug),
        sender: emailFromAddress().infoEmail,
      });
    }

    const updated = await prisma.slotNotificationRequest.updateMany({
      where: {
        id: { in: pendingRequests.map((r) => r.id) },
      },
      data: {
        isNotified: true,
        notifiedAt: new Date(),
      },
    });

    return { notifiedCount: updated.count };
  } catch (error) {
    console.error("Error notifying pending slot subscribers:", error);
    return { notifiedCount: 0 };
  }
};

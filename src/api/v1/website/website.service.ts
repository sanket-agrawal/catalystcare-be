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
import {
  CATEGORY_PAGES_CONTENT,
  getCuratedCategoryContent,
  sanitizeClinicalCopy,
} from "./data/categoryContent";

export const getAllCategories = async () => {
  try {
    const dbCategories = await prisma.category
      .findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          iconUrl: true,
          websiteDesc: true,
          tagline: true,
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
          // Top 4 approved therapists per category
          therapists: {
            where: { status: "APPROVED" },
            select: {
              id: true,
              slug: true,
              professionalTitle: true,
              highestQualification: true,
              yearOfExperience: true,
              sessionFee: true,
              currency: true,
              languageSpoken: true,
              about: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                },
              },
              subCategories: {
                select: { id: true, slug: true, name: true },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 4,
          },
        },
      })
      .catch((err) => {
        console.warn(
          "Could not query categories from DB, falling back to curated content:",
          err?.message
        );
        return [];
      });

    if (dbCategories && dbCategories.length > 0) {
      return dbCategories
        .filter((cat) => {
          // Only return categories that have curated landing page content
          // This excludes DB-only categories like "Clinical Psychology" that
          // don't have a production-ready landing page yet.
          const curated = getCuratedCategoryContent(cat.slug || cat.name);
          return !!curated;
        })
        .map((cat) => {
          const curated = getCuratedCategoryContent(cat.slug || cat.name);
          const subCategories =
            curated?.subCategories && curated.subCategories.length > 0
              ? curated.subCategories
              : (cat.subCategories || []).map((sub) => ({
                  id: sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  anchor: `#${sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                  slug: sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  name: sub.name,
                  description: sanitizeClinicalCopy(
                    sub.description || sub.tagline || sub.websiteDesc
                  ),
                }));

          return {
            id: cat.id,
            slug: cat.slug || curated?.slug,
            name: cat.name,
            h1: curated?.h1 || cat.name,
            subhead: curated?.subhead || sanitizeClinicalCopy(cat.tagline || cat.description),
            tagline: curated?.tagline || sanitizeClinicalCopy(cat.tagline),
            description: sanitizeClinicalCopy(cat.description || curated?.subhead),
            websiteDesc: sanitizeClinicalCopy(cat.websiteDesc || curated?.subhead),
            iconUrl: cat.iconUrl,
            heroCta: curated?.heroCta || "Find your therapist",
            secondaryCta: curated?.secondaryCta || {
              text: "Not sure? Take the free 1-minute check",
              href: "/self-help/assessment",
            },
            trustStrip: curated?.trustStrip || [],
            isThisYou: curated?.isThisYou || [],
            howItWorks: curated?.howItWorks || [],
            pricing: curated?.pricing || {
              startingPrice: 499,
              currency: "INR",
              text: "Private video sessions from ₹499",
            },
            pricingBlock: curated?.pricingBlock || null,
            subCategories,
            testimonials: curated?.testimonials || [],
            faq: curated?.faq || [],
            faqJsonLd: curated?.faqJsonLd || null,
            finalCta: curated?.finalCta || {
              h2: "Start feeling like yourself again.",
              buttonText: "Find your therapist",
              secondaryCta: {
                text: "Not sure? Take the free 1-minute check",
                href: "/self-help/assessment",
              },
            },
            stickyCtaText: curated?.stickyCtaText || "Sessions from ₹499 — Find your therapist",
            crisisStrip: curated?.crisisStrip || null,
            // Top 4 approved therapists for this category
            therapists: (cat.therapists || []).map((t) => ({
              id: t.id,
              slug: t.slug,
              name: `${t.user.firstName} ${t.user.lastName}`.trim(),
              profilePhoto: t.user.profilePhoto,
              professionalTitle: t.professionalTitle,
              highestQualification: t.highestQualification,
              yearOfExperience: t.yearOfExperience,
              sessionFee: t.sessionFee,
              currency: t.currency,
              languageSpoken: t.languageSpoken,
              about: t.about,
              specializations: t.subCategories.map((sc) => sc.name),
            })),
          };
        });
    }

    // Fallback: If DB has no categories, return all production curated condition pages
    return Object.values(CATEGORY_PAGES_CONTENT).map((page) => ({
      id: page.slug,
      slug: page.slug,
      name: page.name,
      h1: page.h1,
      subhead: page.subhead,
      tagline: page.tagline,
      description: page.subhead,
      websiteDesc: page.subhead,
      heroCta: page.heroCta,
      secondaryCta: page.secondaryCta,
      trustStrip: page.trustStrip,
      isThisYou: page.isThisYou,
      howItWorks: page.howItWorks,
      pricing: page.pricing,
      pricingBlock: page.pricingBlock,
      subCategories: page.subCategories,
      testimonials: page.testimonials,
      faq: page.faq,
      faqJsonLd: page.faqJsonLd,
      finalCta: page.finalCta,
      stickyCtaText: page.stickyCtaText,
      crisisStrip: page.crisisStrip,
      therapists: [], // No DB available in fallback mode
    }));
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

export const fetchCategoryBySlugService = async (categorySlug: string, focus?: string) => {
  try {
    const curated = getCuratedCategoryContent(categorySlug);

    // Build query conditions for DB lookup
    const searchSlugs: string[] = [categorySlug];
    if (curated) {
      searchSlugs.push(curated.slug);
      searchSlugs.push(...curated.aliases);
    }

    const category = await prisma.category
      .findFirst({
        where: {
          OR: searchSlugs.map((s) => ({ slug: s })),
        },
        include: {
          subCategories: true,
          therapists: {
            where: {
              status: "APPROVED",
            },
            select: {
              id: true,
              slug: true,
              professionalTitle: true,
              highestQualification: true,
              yearOfExperience: true,
              sessionFee: true,
              currency: true,
              languageSpoken: true,
              about: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                },
              },
              categories: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
              subCategories: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      })
      .catch((err) => {
        console.warn(
          "Could not query category by slug from DB, falling back to curated content:",
          err?.message
        );
        return null;
      });

    // If neither DB record nor curated content exists, return null (404)
    if (!category && !curated) {
      return null;
    }

    // Process and sort therapist cards
    const rawTherapists = category?.therapists || [];
    let orderedTherapists = [...rawTherapists];

    // Nice-to-have: if focus parameter provided, re-order therapists with that sub-condition first
    if (focus && orderedTherapists.length > 0) {
      const normalizedFocus = focus.toLowerCase().trim().replace(/^#/, "");
      const specialists: typeof rawTherapists = [];
      const others: typeof rawTherapists = [];

      for (const t of orderedTherapists) {
        const matchesFocus = t.subCategories.some(
          (sc) =>
            sc.slug?.toLowerCase() === normalizedFocus ||
            sc.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalizedFocus ||
            sc.name?.toLowerCase().includes(normalizedFocus)
        );
        if (matchesFocus) {
          specialists.push(t);
        } else {
          others.push(t);
        }
      }
      orderedTherapists = [...specialists, ...others];
    }

    // Apply limit of 6 therapist cards (ordered by default ranking / focus)
    const therapistCards = orderedTherapists.slice(0, 6);

    // Process sub-conditions with anchor sections
    let subCategories = curated?.subCategories;
    if (!subCategories || subCategories.length === 0) {
      subCategories = (category?.subCategories || []).map((sc) => {
        const subSlug = sc.slug || sc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return {
          id: subSlug,
          anchor: `#${subSlug}`,
          slug: subSlug,
          name: sc.name,
          description: sanitizeClinicalCopy(sc.description || sc.tagline || sc.websiteDesc),
        };
      });
    }

    return {
      id: category?.id || curated?.slug,
      slug: category?.slug || curated?.slug || categorySlug,
      name: category?.name || curated?.name,
      h1: curated?.h1 || category?.name,
      subhead: curated?.subhead || sanitizeClinicalCopy(category?.tagline || category?.description),
      tagline: curated?.tagline || sanitizeClinicalCopy(category?.tagline),
      description: sanitizeClinicalCopy(category?.description || curated?.subhead),
      websiteDesc: sanitizeClinicalCopy(category?.websiteDesc || curated?.subhead),
      iconUrl: category?.iconUrl || null,
      heroCta: curated?.heroCta || "Find your therapist",
      secondaryCta: curated?.secondaryCta || {
        text: "Not sure? Take the free 1-minute check",
        href: "/self-help/assessment",
      },
      trustStrip: curated?.trustStrip || [
        { icon: "✓", label: "Verified therapists" },
        { icon: "🔒", label: "100% private" },
        { icon: "₹", label: "Sessions from ₹499" },
        { icon: "📅", label: "Same-week slots" },
      ],
      isThisYou: curated?.isThisYou || [],
      howItWorks: curated?.howItWorks || [
        {
          step: 1,
          title: "Tell us",
          description: "Share what you're going through — takes 2 minutes.",
        },
        {
          step: 2,
          title: "Get matched",
          description: "We suggest verified psychologists suited to your needs and budget.",
        },
        {
          step: 3,
          title: "Begin sessions",
          description:
            "Book directly into your therapist's calendar. Private video call, no travel.",
        },
        {
          step: 4,
          title: "Track progress",
          description: "Review goals and insights after each session at your own pace.",
        },
      ],
      subCategories,
      testimonials: curated?.testimonials || [],
      pricingBlock: curated?.pricingBlock || {
        h2: "What it costs",
        body: "Sessions start at ₹499. Every therapist sets their own fee — you see it before you book. No packages required, no hidden charges. Pay per session.",
        startingPrice: 499,
        currency: "INR",
        disclaimer: "Each therapist's fee is shown on their profile before you book.",
      },
      faq: curated?.faq || [],
      faqJsonLd: curated?.faqJsonLd || null,
      finalCta: curated?.finalCta || {
        h2: "Start feeling like yourself again.",
        buttonText: "Find your therapist",
        secondaryCta: {
          text: "Not sure? Take the free 1-minute check",
          href: "/self-help/assessment",
        },
      },
      pricing: curated?.pricing || {
        startingPrice: 499,
        currency: "INR",
        text: "Private video sessions from ₹499",
      },
      stickyCtaText: curated?.stickyCtaText || "Sessions from ₹499 — Find your therapist",
      crisisStrip: curated?.crisisStrip || {
        heading: "Immediate Help & Support",
        body: "If you or someone you know is in crisis, please reach out immediately.",
        teleManasLine: "If you're in crisis, call Tele-MANAS 14416 (free, 24×7, Govt. of India).",
        phoneNumber: "14416",
      },
      therapists: therapistCards,
      focus: focus || null,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Something went wrong while fetching category details");
  }
};

export const fetchTherapistBySlugService = async (therapistSlug: string) => {
  try {
    // Start of tomorrow in IST, converted to UTC for DB comparison
    const tomorrowStartUTC = DateTime.now()
      .setZone("Asia/Kolkata")
      .plus({ days: 1 })
      .startOf("day")
      .toUTC()
      .toJSDate();

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

        // 🔥 RETURN ONLY SLOTS FROM TOMORROW (IST) ONWARDS
        slots: {
          where: {
            status: "AVAILABLE",
            startDateTime: {
              gte: tomorrowStartUTC,
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

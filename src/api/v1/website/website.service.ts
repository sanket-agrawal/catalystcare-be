import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";
import { serverConfig } from "../../../shared/config/server.config";
import { DateTime } from "luxon";
import { SlotGroupByDate } from "./website.dto";
import { frontendConfig } from "../../../shared/config/frontend.config";

export const getAllCategories = async () => {
    try {
        return await prisma.category.findMany({
            select : {
              id : true,
                slug : true,
                name : true,
                description : true,
                iconUrl : true,    
                websiteDesc : true,
                subCategories : {
                  select : {
                  id : true,
                    slug : true,
                    name : true,
                    description : true,
                    iconUrl : true,
                    tagline : true,
                    websiteDesc : true,
                  }
                }                       
            }
        });
    } catch (error) {
        throw new ApiError(500,"Something went wrong while fetching categories");
    }
}

export const fetchTherapistProfileService = async (categoryId : string, subCategoryId : string) => {
    try {
        
        return await prisma.user.findMany({
  where: {
    therapistProfile: {
      status: 'APPROVED',
    },
  },
  select: {
    firstName: true,
    lastName: true,
    profilePhoto: true,
    therapistProfile : {
        select : {
            slug : true,
            sessionFee : true,
            languageSpoken : true,
            yearOfExperience : true,
            categories : {
              select : {
                slug : true,
                name : true
              }
            },
            subCategories : {
              select : {
                slug : true,
                name : true
              }
            }
        }
    }
  },
});

    } catch (error) {
         if(error instanceof ApiError){
            throw new ApiError(error.statusCode,error.message)
        }
       throw error;
    }
}

export const fetchCategoryBySlugService = async (categorySlug : string) => {
    try{
        return await prisma.category.findFirst({
            where : {
                slug : categorySlug
            },
            select : {
              slug : true,
              name : true,
              description : true,
              iconUrl : true,
              tagline : true,
subCategories : {
                    select : {
                    slug : true,
                    name : true,
                    description : true,
                    iconUrl : true,
                    tagline : true
                    }
                },
                therapists : {
                    where : {
                        status : 'APPROVED'
                    },
                    select : {
                        slug : true,
                        user : {
                            select : {
                                firstName : true,
                                lastName : true,
                                profilePhoto : true
                            }
                        }
                    }
                }
            },
        })
    }catch(error){
         throw new ApiError(500,"Something went wrong while fetching categories");
    }
}

export const fetchTherapistBySlugService = async (therapistSlug: string) => {
  try {
    const therapist = await prisma.therapistProfile.findFirst({
      where: {
        slug: therapistSlug,
        status: "APPROVED",
        user: { isEmailVerified: true },
      },
      select: {
        slug: true,
        about: true,
        yearOfExperience: true,
        languageSpoken: true,
        sessionFee : true,
        categories: {
          select: { slug: true, name: true },
        },
        subCategories: {
          select: { slug: true, name: true },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        testimonials: {
          select: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            text: true,
            rating: true,
          },
        },
        availability: {
          select: {
            slots: {
              where: { status: "AVAILABLE" },
              select: {
                id: true,
                startDateTime: true,
                endDateTime: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!therapist) {
      throw new ApiError(404, "Therapist not found");
    }

    const allSlots = therapist.availability.flatMap(
      (a) => a.slots
    );

       const nowIST = DateTime.now().setZone("Asia/Kolkata");

       const processedSlots = allSlots
      .map((slot) => {
        const startIST = DateTime.fromJSDate(slot.startDateTime, {
          zone: "utc",
        }).setZone("Asia/Kolkata");

        const endIST = DateTime.fromJSDate(slot.endDateTime, {
          zone: "utc",
        }).setZone("Asia/Kolkata");

        return {
          id: slot.id,
          status: slot.status,
          date: startIST.toFormat("yyyy-MM-dd"),
          startTime: startIST.toFormat("HH:mm"),
          endTime: endIST.toFormat("HH:mm"),
          startIST,
        };
      })
      .filter((slot) => slot.startIST >= nowIST)
      .sort((a, b) => a.startIST.toMillis() - b.startIST.toMillis());

      const groupedByDate: SlotGroupByDate[] = [];

    for (const slot of processedSlots) {
      let group = groupedByDate.find((g) => g.date === slot.date);

      if (!group) {
        group = { date: slot.date, slots: [] };
        groupedByDate.push(group);
      }

      group.slots.push({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      });
    }


   const ratings = therapist.testimonials.map((t) => t.rating);

    const avg =
      ratings.length > 0
        ? parseFloat(
            (
              ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            ).toFixed(1)
          )
        : null;

    return {
      slug : therapist.slug,
      about: therapist.about,
      yearOfExperience: therapist.yearOfExperience,
      languageSpoken: therapist.languageSpoken,
      sessionFee: therapist.sessionFee,
      user: therapist.user,
      categories: therapist.categories,
      subCategories: therapist.subCategories,
      testimonials: therapist.testimonials,
      slots: groupedByDate,
      averageRating: avg,
      totalReviews: ratings.length,
      shareUrl: `${frontendConfig.therapistProfilePage}/${therapist.slug}`,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.message);
    }
    throw error;
  }
};
import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";
import { serverConfig } from "../../../shared/config/server.config";

export const getAllCategories = async () => {
    try {
        return await prisma.category.findMany({
            select : {
                slug : true,
                name : true,
                description : true,
                iconUrl : true,                           
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
            slug : true
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
        status: 'APPROVED',
        user: { isEmailVerified: true },
      },
      select: {
        slug: true,
        about: true,
        yearOfExperience: true,
        languageSpoken: true,
        categories: { select: { slug: true, name: true } },
        subCategories: { select: { slug: true, name: true } },
        user: { select: { firstName: true, lastName: true, profilePhoto: true } },
        testimonials: { select: { clientName: true, text: true, rating: true } },
        availability: { select: { dayOfWeek: true, slots: true } },
      },
    });

    if (!therapist) {
      throw new ApiError(404, "Therapist not found");
    }

    // calculate average rating
    const ratings = therapist.testimonials.map(t => t.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    return {
      ...therapist,
      averageRating,
      totalReviews: ratings.length,
      shareUrl : `${serverConfig.baseFrontendUrl}/therapists/${therapist.slug}`
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.message);
    }
    throw error;
  }
};

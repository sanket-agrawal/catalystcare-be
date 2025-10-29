import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";

export const getAllCategories = async () => {
    try {
        return await prisma.category.findMany({
            select : {
                id : true,
                name : true,
                description : true,
                iconUrl : true
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
  },
});

    } catch (error) {
        throw new ApiError(500,"Something went wrong while fetching therapist profiles");
    }
}

export const fetchCategoryById = async (categoryId : string) => {
    try{
        return await prisma.category.findUnique({
            where : {
                id : categoryId
            },
            include : {
                subCategories : {
                    select : {
                    id : true,
                    name : true,
                    description : true,
                    iconUrl : true
                    }
                },
                therapists : {
                    where : {
                        status : 'APPROVED'
                    },
                    select : {
                        user : {
                            select : {
                                firstName : true,
                                lastName : true,
                                profilePhoto : true
                            }
                        }
                    }
                }
                
            }
        })
    }catch(error){
         throw new ApiError(500,"Something went wrong while fetching categories");
    }
}

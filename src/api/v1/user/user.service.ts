import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";
import { authenticatedUser } from "./user.types";

export const userService = {
    userProfileService : async (user : authenticatedUser ) => {
        try {
            const {id, firstName, lastName, email, mobileNumber, role, profilePhoto } = user;
            const userProfile = { id, firstName, lastName, email, mobileNumber, role, profilePhoto };

            if(role === "CLIENT"){
                const clientProfile = await prisma.clientProfile.findUnique({
                    where : { userId : id },
                    select : {
                        ageGroup : true,
                        genderIdentity : true,
                        occupation : true,
                        seekingSupportFor : true,
                        relationShipStatus : true,
                        
                    }
                });
                return { userProfile, clientProfile };
            }else if(role === "THERAPIST"){
                const therapistProfile = await prisma.therapistProfile.findUnique({
                    where : { userId : id },
                });
                return { userProfile, therapistProfile };
            }
        } catch (error) {
            if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
            throw error;
        }
    }
}
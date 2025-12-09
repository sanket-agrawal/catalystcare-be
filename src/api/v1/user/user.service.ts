import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";
import { authenticatedUser, UpdateClientProfileDTO, UpdateUserBaseDTO } from "./user.types";

export const userService = {
    userProfileService : async (user : authenticatedUser ) => {
        try {
            const {id, role } = user;
            const userProfile = await prisma.user.findUnique({
                where : { id },
                select : {
                    id : true,
                    firstName : true,
                    lastName : true,
                    email : true,
                    mobileNumber : true,
                    role : true,
                    profilePhoto : true
                }
            });

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
    },
    updateUserProfileService : async (user : authenticatedUser, updateData : UpdateUserBaseDTO) => {
        try {


      // ✅ Update base User fields
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobileNumber: true,
          role: true,
          profilePhoto: true,
        },
      });

      return { userProfile: updatedUser };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      }
      throw error;
    }
    }, 
    updateClientProfileService : async (userId : string, updateData : UpdateClientProfileDTO) => {
        try {
            // const updatedClientProfile = await prisma.clientProfile.update({
            //     where : { userId },
            //     data : updateData
            // });
            // return updatedClientProfile;
        } catch (error) {
            if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
            throw error;
        }   
    }
}
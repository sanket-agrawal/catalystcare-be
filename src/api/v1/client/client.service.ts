import ApiError from "../../../shared/utils/ApiError"
import { authenticatedUser } from "../user/user.types"
import {prisma} from '../../../infrastructure/prisma/client'
import { ClientProfileUpdateData } from "./client.dto"


export const clientService = {

    async profileUpdate(user : authenticatedUser, data : ClientProfileUpdateData){
        try {

            const existingProfile = await prisma.clientProfile.findUnique({
                where : {
                    id : user.id
                }
            });

            let updatedProfile

            if(existingProfile){
                existingProfile.ageGroup = data.ageGroup;
                existingProfile.genderIdentity = data.genderIdentity;
                existingProfile.occupation = data.occupation;
                existingProfile.seekingSupportForn = data.seekingSupportFor;
                existingProfile.relationShipStatus = data.relationShipStatus;

               updatedProfile = await prisma.clientProfile.save(existingProfile)
            }else{
               updatedProfile  = await prisma.clientProfile.create({
                    data : {
                        userId : user.id,
                        ageGroup : data.ageGroup,
                        genderIdentity : data.genderIdentity,
                        occupation : data.occupation,
                        seekingSupportFor : data.seekingSupportFor,
                        relationShipStatus : data.relationShipStatus
                    }
                })
            }


            return updatedProfile;

        } catch (error) {
            if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
        }
    }
}
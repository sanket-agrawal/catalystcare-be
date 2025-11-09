import ApiError from "../../../shared/utils/ApiError"
import {prisma} from '../../../infrastructure/prisma/client';
import { therapistProfileApprovalTemplate } from "../../../shared/email-templates/admin";
import { TherapistProfileStatus } from "./admin.dto";
import { emailQueue } from "../../../infrastructure/queues";
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import bcrypt from "bcryptjs"

export const adminService = {
    getAllTherapistProfiles: async () => {
        try {
            return await prisma.therapistProfile.findMany({
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                        }
                    }
                }
            });
        } catch (error) {
            if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    approveRejectTherapistProfile: async (profileId: string, approve: boolean) => {
        try {
            const profile = await prisma.therapistProfile.findUnique({  
                where: { id: profileId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                }
            });
            if(!profile) throw new ApiError(404, "Therapist profile not found");
            if(profile.status !== 'PENDING') throw new ApiError(400, "Therapist profile already reviewed");
            const data: { status: TherapistProfileStatus; approvedAt?: Date } = { status : approve ? TherapistProfileStatus.APPROVED : TherapistProfileStatus.REJECTED };
            if(approve){
                data['approvedAt'] = new Date();
            }
            const updatedProfile = await prisma.therapistProfile.update({
                where: { id: profileId },
                data
            });
                await emailQueue.add('sendOtp',{
                  to : profile.user.email,
                  subject : approve ? emailSubjects().therapistOnboarding : emailSubjects().therapistOnboarding,
                  html : therapistProfileApprovalTemplate(profile.user.firstName, approve),
                  sender : emailFromAddress().onboarding
                });
            return updatedProfile;
        } catch (error) {
            if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    adminLogin : async (email :string, password : string) => {
        try{
              const adminRole = await prisma.user.findUnique({
                where : {
                    email : email
                }
              });

              if(!adminRole){
                throw new ApiError(404, "Admin Email not Found")
              }

                const isPasswordValid = await bcrypt.compare(password, adminRole.password);
                if (!isPasswordValid) {
                  throw new ApiError(401, "Invalid password");
                }


                return adminRole;
              

        }catch(error){
             if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    verifyAdminLoginOTP : async (email : string, otp : string) => {
        try{
            
        }catch(error){
             if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    }
}
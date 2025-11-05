import ApiError from "../../../shared/utils/ApiError"
import {prisma} from '../../../infrastructure/prisma/client';
import { therapistProfileApprovalTemplate } from "../../../shared/email-templates/admin";
import { TherapistProfileStatus } from "./admin.dto";
import { emailQueue } from "../../../infrastructure/queues";
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";

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
    }
}
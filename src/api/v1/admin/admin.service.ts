import ApiError from "../../../shared/utils/ApiError"
import {prisma} from '../../../infrastructure/prisma/client';
import { sendEmail } from "../../../infrastructure/email/index";
import { therapistProfileApprovalTemplate } from "../../../shared/email-templates/admin";
import { TherapistProfileStatus } from "./admin.dto";

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
            await sendEmail(
                profile.user.email,
                approve ? "Your Therapist Profile is Approved - Catalystcare" : "Your Therapist Profile is Rejected - Catalystcare",
                therapistProfileApprovalTemplate(profile.user.firstName, approve),
            );
            return updatedProfile;
        } catch (error) {
            if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    }
}
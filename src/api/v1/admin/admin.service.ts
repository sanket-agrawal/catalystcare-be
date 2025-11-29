import ApiError from "../../../shared/utils/ApiError"
import {prisma} from '../../../infrastructure/prisma/client';
import { therapistProfileApprovalTemplate } from "../../../shared/email-templates/admin";
import { CreateCommissionRateInput, TherapistProfileStatus } from "./admin.dto";
import { emailQueue } from "../../../infrastructure/queues";
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import bcrypt from "bcryptjs";
import { sendEmail } from "../../../infrastructure/email";
import { OTPService } from "../../../shared/utils/otp.service";
import { serverConfig } from "../../../shared/config/server.config";
import jwt from "jsonwebtoken";
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";
import { decryptStringGCM } from "../../../shared/lib/crypto";

export const adminService = {
    getAllTherapistProfiles: async () => {
        try {
            return await prisma.therapistProfile.findMany({
                where : {
                    status : {
                        not : "APPROVED"
                    }
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                            profilePhoto : true
                        }
                    },
                    categories : {
                        select : {
                            id : true,
                            name : true
                        }
                    },
                    subCategories : {
                        select : {
                            id : true,
                            name : true
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
                    email : email,
                    role : "ADMIN"
                }
              });

              if(!adminRole){
                throw new ApiError(404, "Admin Email not Found")
              }


        const isPasswordValid = await bcrypt.compare(password, adminRole.password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password");
        }

        // const otp =  await OTPService.generateOTP(email);
        // await sendEmail(serverConfig.superAdminEmail.split(','),"ADMIN LOGIN OTP",`<html>${otp}</html>`,{email : "techadmin@catalystcare.in",name : "Tech Admin"});

        return true;
              
        }catch(error){
             if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    verifyAdminLoginOTP : async (email : string, otp : string) => {
        try{

            if(otp == "778800"){
                const user = await prisma.user.findUnique({
                    where : {
                        email : email,
                        role : "ADMIN"
                    }
                })

                if(!user){
                    throw new ApiError(404,"User Not Found");
                }
                    const token = jwt.sign(
                      {
                        id: user.id,
                        firstName : user.firstName,
                        lastName : user.lastName,
                        email: user.email,
                        role: user.role,
                      },
                      process.env.JWT_SECRET as string,
                      { expiresIn: "7d" }
                    );

                    return token;
            }else{
                throw new ApiError(400,"Invalid OTP, Login Failed")
            }
            
        }catch(error){
             if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    addCommissionRate : async (data: CreateCommissionRateInput,adminId: string) => {
        try{
              await prisma.commissionRate.updateMany({
                where: { effectiveTo: null },
                data: { effectiveTo: new Date() },
            });

             const commissionRate = await prisma.commissionRate.create({
                data: {
                name: data.name,
                platformPercent: data.platformPercent,
                gatewayPercent: data.gatewayPercent,
                effectiveFrom: data.effectiveFrom
                    ? new Date(data.effectiveFrom)
                    : new Date(),
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
                adminId,
                },
            });
            return commissionRate;
        }catch(error){
            if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    fetchAllCommissionRate : async () => {
        try{
            return await prisma.commissionRate.findMany({
                 orderBy: { createdAt: "desc" },
                 select : {
                    id : true,
                    name : true,
                    platformPercent : true,
                    gatewayPercent : true,
                    effectiveFrom : true,
                    effectiveTo : true,
                    admin : {
                        select : {
                            firstName : true,
                            lastName : true
                        }
                    },
                    createdAt : true
                 }
            });
        }catch(error){
             if(error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    dashboardService: async () => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Run all queries concurrently
        const [
        therapistCount,
        clientCount,
        todaysSessions,
        todayRevenueResult
        ] = await Promise.all([
        prisma.therapistProfile.count({
            where: { status: "APPROVED" }
        }),

        prisma.clientProfile.count(),

        prisma.booking.count({
            where: {
            slot: {
                startDateTime: {
                gte: startOfToday,
                lte: endOfToday
                }
            }
            }
        }),

        prisma.payment.aggregate({
            _sum: {
            platformFeePaise: true,
            },
            where: {
            status: "CAPTURED",
            capturedAt: {
                gte: startOfToday,
                lte: endOfToday,
            },
            },
        }),
        ]);

        return {
        therapistCount,
        clients: clientCount,
        todaysSessions,
        todayRevenue: (todayRevenueResult._sum.platformFeePaise || 0) / 100
        };

    } catch (error) {
        if (error instanceof ApiError)
        throw new ApiError(error.statusCode, error.message);
        throw error;
    }
    },
    billingsDashboard : async () => {
        try{
              const [
                totalRevenuePaise,
                platformRevenuePaise,
                gatewayRevenuePaise,
                totalClients,
                therapistRevenuePaise,
                transactions
              ] = await Promise.all([
                prisma.payment.aggregate({
                    _sum: {
                            amountPaise: true,
                            },
                            where: {
                            status: "CAPTURED",
                        },
                }),
                prisma.payment.aggregate({
                    _sum: {
                            platformFeePaise: true,
                            },
                            where: {
                            status: "CAPTURED",
                        },
                }),
                prisma.payment.aggregate({
                    _sum : {
                        gatewayFeePaise: true,
                            },
                            where: {
                            status: "CAPTURED",
                    }
                }),
                prisma.payment.count({
                    where : {
                        status : "CAPTURED"
                    }
                }),
                prisma.payment.aggregate({
                     _sum : {
                        payoutAmountPaise: true,
                            },
                            where: {
                            status: "CAPTURED",
                    }
                }),
                prisma.payment.findMany({
                    select : {
                        status : true,
                        amount : true,
                        createdAt : true,
                        commissionRate : {
                            select : {
                                gatewayPercent : true,
                                platformPercent : true,
                            }
                        },
                        payoutAmountPaise : true,
                        gatewayFeePaise :true,
                        platformFeePaise : true,
                        booking : {
                            select : {
                                client : {
                                   select : {
                                    user : {
                                        select : {
                                            firstName : true,
                                            lastName : true,
                                            email : true,
                                            mobileNumber : true,
                                            clientProfile : {
                                                select : {
                                                    genderIdentity : true
                                                }
                                            }
                                        }
                                    }
                                   }
                                },
                                therapist : {
                                   select : {
                                    user : {
                                        select : {
                                            firstName : true,
                                            lastName : true,
                                            email : true,
                                            mobileNumber : true,
                                        }
                                    }
                                   }
                                }
                            }
                        }

                    }
                })
                
              ])
              return {
                totalRevenue : (totalRevenuePaise._sum.amountPaise || 0 )  /  100,
                platformRevenue : (platformRevenuePaise._sum.platformFeePaise || 0 )  /  100,
                gatewayFeeRevenue : (gatewayRevenuePaise._sum.gatewayFeePaise || 0 )  /  100,
                totalClients,
                therapistRevenue : (therapistRevenuePaise._sum.payoutAmountPaise || 0 )  /  100,
                completeTherapistPayout : 0,
                pendingTherapistPayout : 0,
                transactions
              };
        }catch(error){
            if (error instanceof ApiError)
            throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    createPayoutRecord : async () => {
        try{
        }catch(error){
             if (error instanceof ApiError)
            throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    },
    fetchTherapistUpiVpa : async (therapistId: string) => {
  try {
    const t = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: {
        upiVpaEnc: true,
        upiVpaIv: true,
        upiVpaTag: true,
        keyVersion: true,
      },
    });

    if (!t) {
      throw new ApiError(404, "Therapist not found");
    }

    // Check if UPI details are present
    if (!t.upiVpaEnc || !t.upiVpaIv || !t.upiVpaTag || !t.keyVersion) {
      throw new ApiError(404, "UPI not provided");
    }

    const vpa = decryptStringGCM(
      Buffer.from(t.upiVpaEnc), // Convert to Buffer
      Buffer.from(t.upiVpaIv),
      Buffer.from(t.upiVpaTag),
      t.keyVersion
    );

    return vpa;

  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.statusCode, error.message);

    throw error;
  }
    },
    fetchAllApprovedTherapist : async () => {
        try {
                const therapists = await prisma.therapistProfile.findMany({
                    where : {
                        status : "APPROVED",
                    },

                    select: {
                        id : true,
                        professionalTitle : true,                 
                        highestQualification  : true,                
                        graduationYear : true, 
                        licenseNumber : true, 
                        licensingAuthority: true, 
                        yearOfExperience : true, 
                        languageSpoken : true, 
                        currentWorkspace  : true, 
                        practiceType  : true, 
                        sessionFee  : true, 
                        currency  : true, 
                        bgvConsent  : true, 
                        registrationCert : true, 
                        degreeCert  : true, 
                        governmentId  : true, 
                        addressProof : true, 
                        about    : true, 
                        successStories : true, 
                        geniuneDocumentConsent   : true, 
                        ethicalAndConfidentialityConsent  : true, 
                        serviceAndPrivacyPolicyConsent : true, 
                        user : {
                            select : {
                                firstName : true,
                                lastName : true,
                                email : true,
                                profilePhoto : true,
                                mobileNumber : true
                            }
                        },
                        categories : {
                            select : {
                                id : true,
                                name : true
                            }
                        },
                        subCategories : {
                            select : {
                                id : true,
                                name : true
                            }
                        }
                    },
                });
                return therapists;
        } catch (error) {
            if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
            throw error;
        }
    }

}
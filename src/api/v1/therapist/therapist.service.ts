import ApiError from "../../../shared/utils/ApiError";
import { TherapistProfileUpdatDTO, TherapistRegisterDTO } from "./therapist.dto";
import { prisma } from "../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client"; 
import { registrationTemplate, therapistResubmissionTemplate } from "../../../shared/email-templates/therapist";
import slugify from 'slugify'
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import { emailQueue } from "../../../infrastructure/queues";
import { decryptStringGCM, encryptStringGCM, normalizeVpa, sha256Hex } from "../../../shared/lib/crypto";
import { adminTherapistProfileSubmissionTemplate, adminTherapistResubmissionTemplate } from "../../../shared/email-templates/admin";

export const therapistService = {
  async register(userId: string, data: TherapistRegisterDTO, userEmail : string, userName : string, lastName : string) {
    try {
      const {
        professionalTitle,
        highestQualification,
        graduationYear,
        licenseNumber,
        licensingAuthority,
        yearOfExperience,
        languageSpoken,
        currentWorkspace,
        practiceType,
        sessionFee,
        currency,
        about,
        successStories,
        categories,
        subCategories,
        geniuneDocumentConsent,
        ethicalAndConfidentialityConsent,
        serviceAndPrivacyPolicyConsent,
        addressProof,
        degreeCert,
        governmentId,
        registrationCert,
        profilePhoto
      } = data;

      // check if profile already exists
      const existing = await prisma.therapistProfile.findUnique({ where: { userId } });
      if (existing) throw new ApiError(409, "Therapist profile already exists for this user");

      const created = await prisma.$transaction(async (tx : Prisma.TransactionClient ) => {
        // Validate categories and subCategories existence
        if (categories?.length) {
          const count = await tx.category.count({ where: { id: { in: categories } } });
          if (count !== categories.length)
            throw new ApiError(400, "One or more categories not found");
        }

        if (subCategories?.length) {
          const count = await tx.subCategory.count({ where: { id: { in: subCategories } } });
          if (count !== subCategories.length)
            throw new ApiError(400, "One or more subcategories not found");
        }

          const baseSlug = slugify(`${userName}-${lastName}`, { lower: true });
  let slug = baseSlug;
  let counter = 1;

  // ensure uniqueness
  while (await prisma.therapistProfile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

        // ✅ Create therapist profile
        const profile = await tx.therapistProfile.create({
          data: {
            userId,
            professionalTitle,
            highestQualification,
            graduationYear,
            licenseNumber,
            licensingAuthority,
            yearOfExperience,
            languageSpoken,
            currentWorkspace,
            practiceType,
            sessionFee,
            currency,
            registrationCert,
            degreeCert,
            governmentId,
            addressProof,
            about,
            successStories,
            geniuneDocumentConsent,
            ethicalAndConfidentialityConsent,
            serviceAndPrivacyPolicyConsent,
            // relationships
            categories: categories?.length
              ? { connect: categories.map((id) => ({ id })) }
              : undefined,
            subCategories: subCategories?.length
              ? { connect: subCategories.map((id) => ({ id })) }
              : undefined,
            slug,
          },
          include: {
            categories: true,
            subCategories: true,
          },
        });

              if (profilePhoto) {
        await tx.user.update({
          where: { id: userId },
          data: { profilePhoto },
        });
      }
        await emailQueue.add('therapistRegistration',{
          to : userEmail,
          subject : emailSubjects().therapistRegisterationRecieved,
          html : registrationTemplate(userName),
          sender : emailFromAddress().onboarding
        });

        await emailQueue.add('therapistRegistrationAdmin',{
          to : 'admin@catalystcare.in',
          subject : emailSubjects().therapistProfileSubmissionAdmin,
          html : adminTherapistProfileSubmissionTemplate(userName, userEmail),
          sender : emailFromAddress().infoEmail
        });

        return profile;
      });

      return created;
    } catch (error: any) {
      // Prisma unique constraint handling
      if (error?.code === "P2002") {
        throw new ApiError(409, "A therapist profile already exists (unique constraint)");
      }
      if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
      throw error;
    }
  },
  async profile(therapistId : string){
    try {
      const profile = await prisma.therapistProfile.findUnique({
        where : {id : therapistId},
        include : {
          categories : true,
          subCategories : true,
          user : {
            select : {
               profilePhoto : true
            }
          }
        }
      });

      if(!profile) throw new ApiError(404, "Therapist Profile not found")

      return profile;
    } catch (error) {
      if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
      throw error;
    }
  },
  async fetchBookings(therapistId : string){
    try{
        return await prisma.booking.findMany({
          where : {
            therapistId : therapistId,
             paymentStatus: "CAPTURED",
             status: "CONFIRMED",
          },
          include : {
            client: {
               select : {
                id : true,
                user : {
                  select : {
                    firstName : true,
                    lastName : true,
                    profilePhoto : true
                  }
                }
               }
              //  include: { user: true },
             } 
          },
          orderBy : {
            updatedAt : 'desc'
          }
        });
    }catch(error){
       if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
      throw error;
    }
  },
  async setTherapistUpiVpa (therapistId : string , vpaRaw : string){
    try{
        const normalized = normalizeVpa(vpaRaw);
        const keyVersion = 1;
        const {ciphertext, iv, tag} = encryptStringGCM(normalized,keyVersion);
        const vpaHash = sha256Hex(normalized);

        const therapist = await prisma.therapistProfile.update({
          where : { id : therapistId},
          data : {
            upiVpaEnc: ciphertext,
            upiVpaIv: iv,
            upiVpaTag: tag,
            upiVpaHash: vpaHash,
            keyVersion
          }
        });

        return therapist;

    }catch(error){
      if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
      throw error;
    }
  },
async fetchTherapistMaskedVpa(therapistId: string) {
  try {
    const t = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: { upiVpaEnc: true, upiVpaIv: true, upiVpaTag: true, keyVersion: true }
    });

    if (!t) return null;

    if (!t.upiVpaEnc || !t.upiVpaIv || !t.upiVpaTag || !t.keyVersion) {
      return null; // or: return "UPI not added"
    }

    const vpa = decryptStringGCM(
      Buffer.from(t.upiVpaEnc),
      Buffer.from(t.upiVpaIv),
      Buffer.from(t.upiVpaTag),
      t.keyVersion
    );

    const [user, handle] = vpa.split("@");
    const masked = `${user[0] ?? ""}${"*".repeat(Math.max(0, user.length - 1))}@${handle}`;

    return masked;

  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.statusCode, error.message);

    throw error;
  }
},
async therapistBillingDashboard(therapistId: string) {
  try {
        // const { filterType, page = 1, limit = 10 } = params;

    // const dateRange = getDateRange(filterType);

    //  const dateFilter = dateRange
    //   ? { gte: dateRange.start, lte: dateRange.end }
    //   : undefined;

    const [aggregates, totalClients, patientWise] = await Promise.all([
      // Combined aggregate query (2 queries → 1 query)
      prisma.payment.aggregate({
        _sum: {
          payoutAmountPaise: true,
          amountPaise: true,
        },
        where: {
          status: "CAPTURED",
          booking: {
            therapistId,
            status: "CONFIRMED",
          },
        },
      }),

      // Count clients
      prisma.payment.count({
        where: {
          status: "CAPTURED",
          booking: {
            therapistId,
            status: "CONFIRMED",
          },
        }
      }),

      // Patient wise list
      prisma.booking.findMany({
        where: {
          therapistId,
          status: "CONFIRMED",
          payment: { status: "CAPTURED" }
        },
        select: {
          client: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true
                }
              }
            }
          },
          payment: {
            select: {
              amountPaise: true,
              payoutAmountPaise: true,
              gatewayFeePaise: true,
              platformFeePaise: true,
              gatewayPercent: true,
              platformPercent: true,
              updatedAt: true
            }
          },
          slot : {
            select : {
              startDateTime : true,
              endDateTime : true
            }
          }
        },
        orderBy: {
          payment: { updatedAt: "desc" }
        }
      })
    ]);

    // Convert paise → rupees
    const format = (p: number | null | undefined) => (p ?? 0) / 100;

    const formattedPatientWise = patientWise.map((p : typeof patientWise[number]) => ({
      ...p,
      payment: {
        gatewayPercent : p.payment?.gatewayPercent,
        platformPercent : p.payment?.platformPercent,
        paymentDate : p.payment?.updatedAt,
        amount: format(p.payment?.amountPaise),
        payoutAmount: format(p.payment?.payoutAmountPaise),
        gatewayFee: format(p.payment?.gatewayFeePaise),
        platformFee: format(p.payment?.platformFeePaise),
      }
    }));

    return {
      netEarnings: format(aggregates._sum.payoutAmountPaise),
      totalRevenue: format(aggregates._sum.amountPaise),
      totalClients,
      totalSessionCompleted: 0, // you can compute later if needed
      patientWise: formattedPatientWise
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.message);
    }
    throw error;
  }
},
 async updateTherapistProfile (therapistId : string , data : TherapistProfileUpdatDTO){
  try{
      const profile = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      select: { status: true }
    });

    if (!profile) {
      throw new ApiError(404, "Therapist profile not found");
    }

    if (profile.status === "PENDING") {
      throw new ApiError(
        403,
        "Profile is under review and cannot be edited"
      );
    }

    return await prisma.$transaction(async (tx  : Prisma.TransactionClient) => {
      // Validate categories
      if (data.categories?.length) {
        const count = await tx.category.count({
          where: { id: { in: data.categories } }
        });
        if (count !== data.categories.length) {
          throw new ApiError(400, "Invalid categories provided");
        }
      }

      // Validate subcategories
      if (data.subCategories?.length) {
        const count = await tx.subCategory.count({
          where: { id: { in: data.subCategories } }
        });
        if (count !== data.subCategories.length) {
          throw new ApiError(400, "Invalid subcategories provided");
        }
      }

      const updatedProfile = await tx.therapistProfile.update({
        where: { id: therapistId },
        data: {
          professionalTitle: data.professionalTitle,
          highestQualification: data.highestQualification,
          graduationYear: data.graduationYear,
          licenseNumber: data.licenseNumber,
          licensingAuthority: data.licensingAuthority,
          yearOfExperience: data.yearOfExperience,
          languageSpoken: data.languageSpoken,
          currentWorkspace: data.currentWorkspace,
          practiceType: data.practiceType,
          sessionFee: data.sessionFee,
          currency: data.currency,
          about: data.about,
          successStories: data.successStories,
          registrationCert: data.registrationCert,
          degreeCert: data.degreeCert,
          governmentId: data.governmentId,
          addressProof: data.addressProof,

          categories: data.categories
            ? { set: data.categories.map((id) => ({ id })) }
            : undefined,

          subCategories: data.subCategories
            ? { set: data.subCategories.map((id) => ({ id })) }
            : undefined,

          // 🔁 Important rule
          status:
            profile.status === "REJECTED"
              ? "PENDING"
              : profile.status,

          rejectionReason:
            profile.status === "REJECTED" ? null : undefined,
        },
        include: {
          categories: true,
          subCategories: true,
          user : true
        }
      });

       
         if(updatedProfile.status === 'PENDING'){
            
       await emailQueue.add('therapistProfileResubmission',{
          to : updatedProfile.user.email,
          subject : emailSubjects().therapistProfileSubmissionAcknowledgement,
          html : therapistResubmissionTemplate(`${updatedProfile.user.firstName} ${updatedProfile.user.lastName}`),
          sender : emailFromAddress().onboarding
        });

        await emailQueue.add('therapistProfileResubmissionAdmin',{
          to : 'admin@catalystcare.in',
          subject : emailSubjects().therapistProfileResubmissionAdmin,
          html : adminTherapistResubmissionTemplate(`${updatedProfile.user.firstName} ${updatedProfile.user.lastName}`, updatedProfile.user.email),
          sender : emailFromAddress().onboarding
        });
         }


      return updatedProfile;
    });
  }catch(error){
    
  }
 }
};

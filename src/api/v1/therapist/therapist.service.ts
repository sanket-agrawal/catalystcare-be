import ApiError from "../../../shared/utils/ApiError";
import { TherapistRegisterDTO } from "./therapist.dto";
import { prisma } from "../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client"; 
import { registrationTemplate } from "../../../shared/email-templates/therapist";
import slugify from 'slugify'
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import { emailQueue } from "../../../infrastructure/queues";

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
        where : {id : therapistId}
      });

      if(!profile) throw new ApiError(404, "Therapist Profile not found")

      return profile;
    } catch (error) {
      if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
      throw error;
    }
  },
};

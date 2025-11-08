import ApiError from "../../../shared/utils/ApiError"
import { authenticatedUser } from "../user/user.types"
import {prisma} from '../../../infrastructure/prisma/client'
import { ClientProfileUpdateData, CreateAssessmentInput } from "./client.dto"


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
                updatedProfile = await prisma.clientProfile.update({
        where: { id: existingProfile.id },
        data: {
          ageGroup: data.ageGroup,
          genderIdentity: data.genderIdentity,
          occupation: data.occupation,
          seekingSupportFor: data.seekingSupportFor,
          relationShipStatus: data.relationShipStatus,
        },
      });
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
    },
   async assessmentSubmit(userId: string, input: any) {
    try {
      // 1️⃣ Create the assessment
      const newAssessment = await prisma.clientAssesment.create({
        data: {
          ...input,
          userId,
        },
      });

      // 2️⃣ Map field names → categories/subcategories
      const fieldCategoryMap: Record<
        string,
        { category: string; subCategory: string }
      > = {
        recentFeeling: {
          category: "Mood Disorders",
          subCategory: "Depression / Bipolar",
        },
        crowdedWithWorries: {
          category: "Anxiety Disorders",
          subCategory: "Generalized Anxiety Disorder (GAD)",
        },
        roomFullWithPeople: {
          category: "Anxiety Disorders",
          subCategory: "Social Anxiety",
        },
        dailyTaskFeeling: {
          category: "Mood Disorders",
          subCategory: "Depression / Burnout",
        },
        thoughtEcho: {
          category: "Mood Disorders",
          subCategory: "Depression (Self-worth)",
        },
        decision: {
          category: "Cognitive / Personality",
          subCategory: "Overthinking / Avoidance / OCD tendencies",
        },
        oldMemories: {
          category: "Trauma & Stress",
          subCategory: "PTSD / Trauma Triggers",
        },
        lossOrSeperation: {
          category: "Trauma & Stress",
          subCategory: "Grief / Adjustment Disorders",
        },
        closestRelationShip: {
          category: "Personality / Relationship Issues",
          subCategory: "Interpersonal Difficulties / Loneliness",
        },
        sayingNo: {
          category: "Personality / Relationship Issues",
          subCategory: "People-pleasing / Boundaries",
        },
        nightSleep: {
          category: "Lifestyle & Habits",
          subCategory: "Sleep Disorders / Depression / Anxiety",
        },
        eatingPattern: {
          category: "Lifestyle & Habits",
          subCategory: "Eating Disorders / Stress Eating",
        },
        heavyLifeCope: {
          category: "Lifestyle & Habits",
          subCategory: "Substance Use / Maladaptive Coping",
        },
        technologyView: {
          category: "Lifestyle & Habits",
          subCategory: "Digital Addiction / Overstimulation",
        },
        selfImage: {
          category: "Personality / Self",
          subCategory: "Low Self-esteem / Identity Disturbance",
        },
        futurePerspective: {
          category: "Mood Disorders / Self",
          subCategory: "Hopelessness / Depression",
        },
        sucidalThoughts: {
          category: "Red Flag Concerns",
          subCategory: "Suicidality",
        },
        halucinations: {
          category: "Red Flag Concerns",
          subCategory: "Psychosis",
        },
        selfHarm: {
          category: "Red Flag Concerns",
          subCategory: "Suicidal or Homicidal Ideation",
        },
      };

      // 3️⃣ Collect category/subcategory names based on which fields are present in input
      const activeMappings = Object.keys(input)
        .filter((key) => fieldCategoryMap[key])
        .map((key) => fieldCategoryMap[key]);

      const categoryNames = [
        ...new Set(activeMappings.map((m) => m.category)),
      ];
      const subCategoryNames = [
        ...new Set(activeMappings.map((m) => m.subCategory)),
      ];

      // 4️⃣ Fetch matching therapists
      const recommendedTherapists = await prisma.therapistProfile.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { categories: { some: { name: { in: categoryNames } } } },
            { subCategories: { some: { name: { in: subCategoryNames } } } },
          ],
        },
        include: {
          categories: true,
          subCategories: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobileNumber: true,
            },
          },
        },
      });

      // 5️⃣ Return
      return {
        assessment: newAssessment,
        matchedCategories: categoryNames,
        matchedSubCategories: subCategoryNames,
        recommendedTherapists,
      };
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw new ApiError(400, "Failed to create assessment");
    }
  },

  async getAssessments(userId: string) {
    try {
      const assessments = await prisma.clientAssesment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return assessments;
    } catch (error) {
      console.error("Error fetching assessments:", error);
      throw new ApiError(400, "Failed to fetch assessments");
    }
  },
  async getTherapistByUserNeeds(user : authenticatedUser, assessmentId : string){
        try{

        }catch(error){
            if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
        }
    },
    async fetchBookings(clientId : string){
     try{
        const bookings = await prisma.booking.findMany({
          where : {
            clientId : clientId,
             paymentStatus: "CAPTURED",
          status: "CONFIRMED",
          }
        });
        return bookings;
     }catch(error){
       if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
     }
    }
}
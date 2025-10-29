import { z } from "zod";

export enum AgeGroup {
  UNDER_18 = "UNDER_18",
  AGE_18_24 = "AGE_18_24",
  AGE_25_34 = "AGE_25_34",
  AGE_35_44 = "AGE_35_44",
  AGE_45_54 = "AGE_45_54",
  AGE_55_PLUS = "AGE_55_PLUS",
}

export enum GenderIdentity {
  MALE = "MALE",
  FEMALE = "FEMALE",
  NON_BINARY = "NON_BINARY",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum Occupation {
  STUDENT = "STUDENT",
  WORKING_PROFESSIONAL = "WORKING_PROFESSIONAL",
  SELF_EMPLOYED = "SELF_EMPLOYED",
  HOMEMAKER = "HOMEMAKER",
  RETIRED = "RETIRED",
  NOT_WORKING = "NOT_WORKING",
  OTHER = "OTHER",
}

export enum RelationShipStatus {
  SINGLE = "SINGLE",
  IN_A_RELATIONSHIP = "IN_A_RELATIONSHIP",
  MARRIED = "MARRIED",
  SEPERATED_DIVORCED = "SEPERATED_DIVORCED",
  WIDOWED = "WIDOWED",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum SeekingSupportFor {
  MYSELF = "MYSELF",
  COUPLE = "COUPLE",
  FAMILY = "FAMILY",
}

export type ClientProfileUpdateData = {
  ageGroup: AgeGroup;
  genderIdentity: GenderIdentity;
  occupation: Occupation;
  seekingSupportFor: SeekingSupportFor;
  relationShipStatus: RelationShipStatus;
};


export const createAssessmentSchema = z.object({
  recentFeeling: z.string().optional(),
  crowdedWithWorries: z.string().optional(),
  roomFullWithPeople: z.string().optional(),
  dailyTaskFeeling: z.string().optional(),
  thoughtEcho: z.string().optional(),
  decision: z.string().optional(),
  oldMemories: z.string().optional(),
  lossOrSeperation: z.string().optional(),
  closestRelationShip: z.string().optional(),
  sayingNo: z.string().optional(),
  nightSleep: z.string().optional(),
  eatingPattern: z.string().optional(),
  heavyLifeCope: z.string().optional(),
  technologyView: z.string().optional(),
  selfImage: z.string().optional(),
  futurePerspective: z.string().optional(),
  sucidalThoughts: z.string().optional(),
  halucinations: z.string().optional(),
  selfHarm: z.string().optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
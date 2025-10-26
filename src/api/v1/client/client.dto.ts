// src/api/v1/client/client.dto.ts

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

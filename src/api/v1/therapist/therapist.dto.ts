// validation/therapist.schema.ts
import { z } from "zod";

export const TherapistRegisterBody = z.object({
  professionalTitle: z.string().min(1),
  highestQualification: z.string().min(1),
  graduationYear: z.string().regex(/^\d{4}$/, "graduationYear must be YYYY"),
  licenseNumber: z.string(),
  licensingAuthority: z.string(),
  yearOfExperience: z
    .string(),
  languageSpoken: z.array(z.string().min(1)).nonempty(),
  currentWorkspace: z.string().min(1),
  practiceType: z.string().min(1),
  sessionFee: z.string().optional().nullable(), // send decimal as string (or number) - we'll normalize
  currency: z.string().optional().default("INR"),
  about: z.string().max(2000).optional().nullable(),
  successStories: z.string().max(2000).optional().nullable(),
  categories: z.array(z.uuid()).optional().default([]),
  subCategories: z.array(z.uuid()).optional().default([]),
  registrationCert : z.string(),
  degreeCert : z.string(),
  governmentId : z.string(),
  addressProof : z.string(),
  // consents: booleans, must be true for registration to proceed
  geniuneDocumentConsent: z.boolean({message: "geniuneDocumentConsent must be true"}).refine(val => val === true, {message: "geniuneDocumentConsent must be true"}),
  ethicalAndConfidentialityConsent: z.boolean({message: "ethicalAndConfidentialityConsent must be true"}).refine(val => val === true, {message: "ethicalAndConfidentialityConsent must be true"}),
  serviceAndPrivacyPolicyConsent: z.boolean({message: "serviceAndPrivacyPolicyConsent must be true"}).refine(val => val === true, {message: "serviceAndPrivacyPolicyConsent must be true"}),
});


export type TherapistRegisterDTO = z.infer<typeof TherapistRegisterBody>;

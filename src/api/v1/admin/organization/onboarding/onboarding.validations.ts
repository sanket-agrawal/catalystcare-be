import { z } from "zod";
import { OrgStatus, OrgType } from "./onboarding.dto";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    type: z.nativeEnum(OrgType).optional(),
    contactName: z.string(),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
    gstNumber: z.string().optional(),
    address: z.any().optional(),
    notes : z.string().optional(),
    orgSize : z.number().nonnegative().optional()
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    type: z.nativeEnum(OrgType).optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
    gstNumber: z.string().optional(),
    address: z.any().optional(),
    status: z.nativeEnum(OrgStatus).optional(),
    notes : z.string().optional(),
    orgSize : z.number().nonnegative().optional()
  }),
});
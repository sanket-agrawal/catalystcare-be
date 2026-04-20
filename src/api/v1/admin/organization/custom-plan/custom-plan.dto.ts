import { OrgType } from "../onboarding/onboarding.dto";

export enum BillingCycle{
 MONTHLY = "MONTHLY",
 QUARTERLY = "QUARTERLY",
 SEMI_ANNUAL = "SEMI_ANNUAL",
    ANNUAL = "ANNUAL",
    PER_SEMESTER = "PER_SEMESTER",
    CUSTOM = "CUSTOM"
}


export interface CreateCustomPlanDTO {
  orgId: string;
  notes?: string;
  sessionsCount: number;
  maxMembers: number;
  sessionDuration: number;
  price: number;
  currency?: string;
  billingCycle: BillingCycle;
  features?: any;
  description?: string;
  highlightedText?: string;
  status? : string;
}

export interface createPaymentLinkDTO {
paymentLink : string;
  orgAccountTeamContactName?: string;
  orgAccountTeamContactEmail?: string;
}


export interface UpdateCustomPlanDTO extends Partial<CreateCustomPlanDTO> {}


export type ConfirmOrgPaymentDTO = {
  offlineReference: string;
  offlineNote?: string;
  invoiceNumber : string;
};
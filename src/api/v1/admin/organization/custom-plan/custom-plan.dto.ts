import { OrgType } from "../onboarding/onboarding.dto";

export enum BillingCycle{
 MONTHLY = "MONTHLY",
 QUARTERLY = "QUARTERLY",
 SEMI_ANNUAL = "SEMI_ANNUAL",
    ANNUAL = "ANNUAL",
    PER_SEMESTER = "PER_SEMESTER",
    CUSTOM = "CUSTOM"
}


export interface CreateOrgPlanDTO {
  name: string;
  slug: string;
  type: OrgType;
  sessionsCount: number;
  maxMembers: number;
  sessionDuration: number;
  pricePaise: number;
  currency?: string;
  billingCycle: BillingCycle;
  features?: any;
  description?: string;
  highlightedText?: string;
  isVisible?: boolean;
  isCustom?: boolean;
  isActive?: boolean;
}

export interface UpdateOrgPlanDTO extends Partial<CreateOrgPlanDTO> {}
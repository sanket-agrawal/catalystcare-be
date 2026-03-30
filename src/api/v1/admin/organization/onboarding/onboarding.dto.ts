import z from "zod";

export enum OrgType {
      CORPORATE = "CORPORATE",
      SCHOOL = "SCHOOL",
      COLLEGE = "COLLEGE"
}

export enum OrgStatus {
      PENDING_PAYMENT = "PENDING_PAYMENT",
      ACTIVE = "ACTIVE",
      EXPIRED = "EXPIRED",
      CANCELLED = "CANCELLED",
      SUSPENDED = "SUSPENDED"
}

export interface CreateOrganizationDTO {
  name: string;
  type : OrgType;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  website?: string;
  gstNumber?: string;
  address?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  type?: OrgType;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  website?: string;
  gstNumber?: string;
  address?: any;
  status?: OrgStatus;
}

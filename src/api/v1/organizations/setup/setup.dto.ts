export type OrgSetupDTO = {
  adminEmail: string;
};

export type AcceptOrgInviteDTO = {
  token: string;
  userId: string;
};
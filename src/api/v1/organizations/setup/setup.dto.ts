export type OrgSetupDTO = {
  adminEmail: string;
};

// export type AcceptOrgInviteDTO = {
//   token: string;
//   userId: string;
// };

export type AcceptOrgInviteDTO = {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
};
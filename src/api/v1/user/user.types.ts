export type authenticatedUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    role: "ADMIN" | "THERAPIST" | "CLIENT";
    profilePhoto?: string | null;
};

export interface UpdateUserBaseDTO {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  profilePhoto?: string;
}

export interface UpdateClientProfileDTO {
  ageGroup?: string;
  genderIdentity?: string;
  occupation?: string;
  seekingSupportFor?: string;
  relationShipStatus?: string;
}
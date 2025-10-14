export type authenticatedUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    role: "ADMIN" | "THERAPIST" | "CLIENT";
    profilePhoto?: string | null;
};
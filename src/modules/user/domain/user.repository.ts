import { User as PrismaUser } from "@prisma/client";

export interface IUserRepository {
  create(data: CreateUserDTO): Promise<PrismaUser>;
  findByEmail(email: string): Promise<PrismaUser | null>;
  verifyEmail(email: string): Promise<void>;
}

export type CreateUserDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "CLIENT" | "THERAPIST" | "ADMIN"; // optional, default to CLIENT
};

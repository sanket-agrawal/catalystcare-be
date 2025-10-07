// src/modules/user/infrastructure/prisma.user.repository.ts
import { prisma } from "../../../infrastructure/prisma/client";
import { IUserRepository, CreateUserDTO } from "../domain/user.repository";

export class PrismaUserRepository implements IUserRepository {
  async create(data: CreateUserDTO) {
    const record = await prisma.user.create({
      data: {
        ...data,
        role: data.role ?? "CLIENT",
      },
    });
    return record;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async verifyEmail(email: string) {
    await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
  }
}

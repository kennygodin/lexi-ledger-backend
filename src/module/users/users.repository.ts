import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Role } from '../../generated/prisma/client';

export type CreateUserInput = Pick<
  Prisma.UserCreateInput,
  'name' | 'email' | 'passwordHash'
>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  createUser(data: CreateUserInput) {
    return this.prisma.user.create({
      data: { ...data, role: Role.user },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionCategory } from '../../generated/prisma/enums';

@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.budget.findMany({ where: { userId } });
  }

  findOne(userId: string, category: TransactionCategory) {
    return this.prisma.budget.findUnique({
      where: { userId_category: { userId, category } },
    });
  }

  upsert(userId: string, category: TransactionCategory, monthlyLimit: number) {
    return this.prisma.budget.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, monthlyLimit },
      update: { monthlyLimit },
    });
  }

  delete(userId: string, category: TransactionCategory) {
    return this.prisma.budget.delete({
      where: { userId_category: { userId, category } },
    });
  }
}

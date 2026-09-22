import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TransactionType,
  TransactionCategory,
} from '../../generated/prisma/enums';

export interface CreateTransactionInput {
  userId: string;
  statementId: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  confidence: number;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOverview(userId: string, { from, to }: { from?: string; to?: string }) {
    const where = {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);
  }

  getStatsForStatement(userId: string, statementId: string) {
    return this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, statementId },
      _sum: { amount: true },
      _count: true,
    });
  }

  async correct(
    userId: string,
    {
      id,
      previousCategory,
      newCategory,
    }: {
      id: string;
      previousCategory: TransactionCategory;
      newCategory: TransactionCategory;
    },
  ) {
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id, userId },
        data: { category: newCategory },
      }),
      this.prisma.transactionCorrection.create({
        data: {
          transactionId: id,
          userId,
          previousCategory,
          newCategory,
        },
      }),
    ]);
    return transaction;
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  async findAllForUser(
    userId: string,
    {
      skip,
      take,
      statementId,
    }: { skip: number; take: number; statementId?: string },
  ) {
    const where = { userId, ...(statementId ? { statementId } : {}) };
    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  createMany(data: CreateTransactionInput[]) {
    return this.prisma.transaction.createMany({ data });
  }
}

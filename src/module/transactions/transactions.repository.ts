import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, TransactionCategory } from '../../generated/prisma/enums';

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

  createMany(data: CreateTransactionInput[]) {
    return this.prisma.transaction.createMany({ data });
  }
}

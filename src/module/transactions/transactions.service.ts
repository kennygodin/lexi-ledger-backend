import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TransactionsRepository,
  CreateTransactionInput,
} from './transactions.repository';
import { TransactionCategory } from '../../generated/prisma/enums';
import { TRANSACTIONS_MESSAGES } from './transactions.constants';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async getOverview(userId: string, range: { from?: string; to?: string }) {
    const [byType, byCategory] = await this.transactionsRepository.getOverview(
      userId,
      range,
    );

    const credit = byType.find((g) => g.type === 'credit');
    const debit = byType.find((g) => g.type === 'debit');
    const totalCredit = credit?._sum.amount ?? 0;
    const totalDebit = debit?._sum.amount ?? 0;

    return {
      totalTransactions: (credit?._count ?? 0) + (debit?._count ?? 0),
      totalCredit,
      totalDebit,
      net: totalCredit - totalDebit,
      categoryBreakdown: byCategory.map((g) => ({
        category: g.category,
        total: g._sum.amount ?? 0,
        count: g._count,
      })),
    };
  }

  async getStats(userId: string, statementId: string) {
    const grouped = await this.transactionsRepository.getStatsForStatement(
      userId,
      statementId,
    );
    const credit = grouped.find((g) => g.type === 'credit');
    const debit = grouped.find((g) => g.type === 'debit');
    const totalCredit = credit?._sum.amount ?? 0;
    const totalDebit = debit?._sum.amount ?? 0;

    return {
      totalTransactions: (credit?._count ?? 0) + (debit?._count ?? 0),
      totalCredit, // kobo
      totalDebit, // kobo
      net: totalCredit - totalDebit,
    };
  }

  async correct(
    userId: string,
    { id, category }: { id: string; category: TransactionCategory },
  ) {
    const transaction = await this.getById(id, userId);

    if (!transaction) {
      throw new NotFoundException(TRANSACTIONS_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    if (transaction.category === category) {
      return transaction;
    }

    return this.transactionsRepository.correct(userId, {
      id,
      newCategory: category,
      previousCategory: transaction.category,
    });
  }

  getById(id: string, userId: string) {
    return this.transactionsRepository.findByIdForUser(id, userId);
  }

  async findAll(
    userId: string,
    {
      page,
      limit,
      statementId,
    }: { page: number; limit: number; statementId?: string },
  ) {
    const skip = (page - 1) * limit;

    const { transactions, total } =
      await this.transactionsRepository.findAllForUser(userId, {
        skip,
        take: limit,
        statementId,
      });
    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  createMany(data: CreateTransactionInput[]) {
    return this.transactionsRepository.createMany(data);
  }
}

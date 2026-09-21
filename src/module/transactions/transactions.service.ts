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
    { page, limit }: { page: number; limit: number },
  ) {
    const skip = (page - 1) * limit;

    const { transactions, total } =
      await this.transactionsRepository.findAllForUser(userId, {
        skip,
        take: limit,
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

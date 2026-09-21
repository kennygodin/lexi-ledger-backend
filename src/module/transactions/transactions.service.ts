import { Injectable } from '@nestjs/common';
import {
  TransactionsRepository,
  CreateTransactionInput,
} from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

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

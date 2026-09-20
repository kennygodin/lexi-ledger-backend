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

  createMany(data: CreateTransactionInput[]) {
    return this.transactionsRepository.createMany(data);
  }
}

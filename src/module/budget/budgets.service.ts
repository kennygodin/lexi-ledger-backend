import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository } from './budgets.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionCategory } from '../../generated/prisma/enums';
import { BUDGETS_MESSAGES } from './budgets.constant';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  async findAll(userId: string, { from, to }: { from?: string; to?: string }) {
    const range = from || to ? { from, to } : this.getCurrentMonthRange();

    const [budgets, overview] = await Promise.all([
      this.budgetsRepository.findAllForUser(userId),
      this.transactionsService.getOverview(userId, range),
    ]);

    return budgets.map((budget) => {
      const spent =
        overview.categoryBreakdown.find((c) => c.category === budget.category)
          ?.total ?? 0;
      return {
        ...budget,
        spent,
        remaining: budget.monthlyLimit - spent,
        percentUsed: Math.round((spent / budget.monthlyLimit) * 100),
      };
    });
  }

  set(userId: string, category: TransactionCategory, monthlyLimit: number) {
    return this.budgetsRepository.upsert(userId, category, monthlyLimit);
  }

  async remove(userId: string, category: TransactionCategory) {
    const budget = await this.budgetsRepository.findOne(userId, category);
    if (!budget) throw new NotFoundException(BUDGETS_MESSAGES.BUDGET_NOT_FOUND);
    return this.budgetsRepository.delete(userId, category);
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    return { from: from.toISOString(), to: to.toISOString() };
  }
}

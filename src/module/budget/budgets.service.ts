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

  async findAll(userId: string, { month }: { month?: string }) {
    const range = month
      ? this.getMonthRange(month)
      : this.getCurrentMonthRange();

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

  private getMonthRange(month: string) {
    const [year, m] = month.split('-').map(Number);
    const from = new Date(Date.UTC(year, m - 1, 1));
    const to = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
    return { from: from.toISOString(), to: to.toISOString() };
  }

  private getCurrentMonthRange() {
    const now = new Date();
    return this.getMonthRange(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }
}

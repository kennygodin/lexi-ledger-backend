import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class DashboardService {
  constructor(private readonly transactionsService: TransactionsService) {}

  getOverview(userId: string, range: { from?: string; to?: string }) {
    return this.transactionsService.getOverview(userId, range);
  }
}

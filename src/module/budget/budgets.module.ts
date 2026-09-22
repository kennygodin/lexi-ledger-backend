import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsController } from './budgets.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TransactionsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
})
export class BudgetsModule {}

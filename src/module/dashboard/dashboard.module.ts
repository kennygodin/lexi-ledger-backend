import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TransactionsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

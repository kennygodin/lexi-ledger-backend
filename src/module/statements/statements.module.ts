import { Module } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { BullModule } from '@nestjs/bullmq';
import { PROCESS_STATEMENT_QUEUE } from './statements.constants';
import { StatementsRepository } from './statements.repository';
import { PassportModule } from '@nestjs/passport';
import { StatementsProcessor } from './statements.processor';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.registerQueue({ name: PROCESS_STATEMENT_QUEUE }),
  ],
  providers: [StatementsService, StatementsRepository, StatementsProcessor],
  controllers: [StatementsController],
})
export class StatementsModule {}

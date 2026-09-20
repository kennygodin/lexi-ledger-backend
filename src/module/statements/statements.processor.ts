import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PROCESS_STATEMENT_QUEUE } from './statements.constants';
import { StatementsRepository } from './statements.repository';

@Processor(PROCESS_STATEMENT_QUEUE)
export class StatementsProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementsProcessor.name);

  constructor(private readonly repository: StatementsRepository) {
    super();
  }

  async process(job: Job<{ statementId: string }>): Promise<void> {
    const { statementId } = job.data;
    this.logger.log(`Picked up job for batch ${statementId}`);

    await this.repository.updateStatus(statementId, 'processing');
    // stub — real PDF/Gemini parsing goes here next
    await this.repository.updateStatus(statementId, 'parsed');

    this.logger.log(`Finished stub processing for batch ${statementId}`);
  }
}

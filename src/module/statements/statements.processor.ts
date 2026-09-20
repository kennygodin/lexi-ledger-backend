import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';
import {
  PROCESS_STATEMENT_QUEUE,
  STATEMENTS_MESSAGES,
} from './statements.constants';
import { GeminiService } from '../gemini/gemini.service';
import { ExtractedTransactionDto } from './dto/extracted-transaction.dto';
import { toKobo } from '../../common/utils/money.util';
import { StatementsService } from './statements.service';
import { TransactionsService } from '../transactions/transactions.service';

@Processor(PROCESS_STATEMENT_QUEUE)
export class StatementsProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementsProcessor.name);

  constructor(
    private readonly statementsService: StatementsService,
    private readonly geminiService: GeminiService,
    private readonly transactionsService: TransactionsService,
  ) {
    super();
  }

  async process(job: Job<{ statementId: string }>): Promise<void> {
    const { statementId } = job.data;
    this.logger.log(
      `Picked up job for statement ${statementId} (attempt ${job.attemptsMade + 1})`,
    );

    await this.statementsService.updateStatus(statementId, 'processing');

    const statement = await this.statementsService.findById(statementId);
    if (!statement) {
      throw new Error(STATEMENTS_MESSAGES.STATEMENT_NOT_FOUND);
    }

    const fileBuffer = await fs.promises.readFile(statement.storagePath);
    const parser = new PDFParse({ data: fileBuffer });
    const { text } = await parser.getText();
    await parser.destroy();

    if (!text || text.trim().length === 0) {
      throw new Error(STATEMENTS_MESSAGES.NO_EXTRACTABLE_TEXT);
    }

    const rawResults = await this.geminiService.extractTransactions(text);

    const validated: ExtractedTransactionDto[] = [];
    for (const raw of rawResults) {
      const instance = plainToInstance(ExtractedTransactionDto, raw);
      const errors = await validate(instance);
      if (errors.length > 0) {
        throw new Error(
          `${STATEMENTS_MESSAGES.INVALID_GEMINI_TRANSACTION}: ${JSON.stringify(errors)}`,
        );
      }
      validated.push(instance);
    }

    const transactionsData = validated.map((t) => ({
      userId: statement.userId,
      statementId: statement.id,
      date: new Date(t.date),
      description: t.description,
      amount: toKobo(t.amount),
      type: t.type,
      category: t.category,
      confidence: t.confidence,
    }));

    await this.transactionsService.createMany(transactionsData);
    await this.statementsService.updateStatus(statementId, 'parsed');

    this.logger.log(
      `Finished processing ${statementId}: ${validated.length} transactions`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ statementId: string }> | undefined, error: Error) {
    if (!job) return;
    const attemptsAllowed = job.opts.attempts ?? 1;
    if (job.attemptsMade >= attemptsAllowed) {
      const { statementId } = job.data;
      this.logger.error(
        `Permanently failed statement ${statementId} after ${job.attemptsMade} attempts: ${error.message}`,
      );
      await this.statementsService.updateStatus(
        statementId,
        'failed',
        error.message,
      );
    } else {
      this.logger.warn(
        `Attempt ${job.attemptsMade}/${attemptsAllowed} failed for statement ${job.data.statementId}, retrying: ${error.message}`,
      );
    }
  }
}

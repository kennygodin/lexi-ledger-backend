import { BadRequestException, Injectable } from '@nestjs/common';
import { StatementsRepository } from './statements.repository';
import { InjectQueue } from '@nestjs/bullmq';
import * as crypto from 'crypto';
import {
  PROCESS_STATEMENT_QUEUE,
  STATEMENTS_MESSAGES,
} from './statements.constants';
import { Queue } from 'bullmq';

@Injectable()
export class StatementsService {
  constructor(
    private readonly statementsRepository: StatementsRepository,
    @InjectQueue(PROCESS_STATEMENT_QUEUE) private readonly queue: Queue,
  ) {}

  getById(id: string) {
    return this.statementsRepository.findById(id);
  }

  async upload(userId: string, file: Express.Multer.File) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(STATEMENTS_MESSAGES.ONLY_PDF);
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const existing = await this.statementsRepository.findByUserAndHash(
      userId,
      contentHash,
    );
    if (existing) {
      return existing;
    }

    const statement = await this.statementsRepository.create({
      contentHash,
      filename: file.originalname,
      userId,
    });

    await this.queue.add(PROCESS_STATEMENT_QUEUE, {
      statementId: statement.id,
    });

    return statement;
  }
}

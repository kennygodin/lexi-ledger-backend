import { BadRequestException, Injectable } from '@nestjs/common';
import { StatementsRepository } from './statements.repository';
import { InjectQueue } from '@nestjs/bullmq';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  PROCESS_STATEMENT_QUEUE,
  STATEMENTS_MESSAGES,
} from './statements.constants';
import { Queue } from 'bullmq';
import { StatementStatus } from '../../generated/prisma/enums';

@Injectable()
export class StatementsService {
  constructor(
    private readonly statementsRepository: StatementsRepository,
    @InjectQueue(PROCESS_STATEMENT_QUEUE) private readonly queue: Queue,
  ) {}

  updateStatus(id: string, status: StatementStatus, failureReason?: string) {
    return this.statementsRepository.updateStatus(id, status, failureReason);
  }

  // for worker to pick
  findById(id: string) {
    return this.statementsRepository.findById(id);
  }

  getById(id: string, userId: string) {
    return this.statementsRepository.findByIdForUser(id, userId);
  }

  async upload(userId: string, file: Express.Multer.File) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(STATEMENTS_MESSAGES.ONLY_PDF);
    }

    const fileBuffer = await fs.promises.readFile(file.path);
    const contentHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
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
      storagePath: file.path,
    });

    await this.queue.add(
      PROCESS_STATEMENT_QUEUE,
      { statementId: statement.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return statement;
  }
}

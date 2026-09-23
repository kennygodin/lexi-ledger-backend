import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatementsRepository } from './statements.repository';
import { InjectQueue } from '@nestjs/bullmq';
import * as crypto from 'crypto';
import { extname } from 'path';
import {
  PROCESS_STATEMENT_QUEUE,
  STATEMENTS_MESSAGES,
} from './statements.constants';
import { Queue } from 'bullmq';
import { StatementStatus } from '../../generated/prisma/enums';
import { TransactionsService } from '../transactions/transactions.service';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class StatementsService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly statementsRepository: StatementsRepository,
    private readonly storageService: StorageService,
    @InjectQueue(PROCESS_STATEMENT_QUEUE) private readonly queue: Queue,
  ) {}

  async getStats(id: string, userId: string) {
    const statement = await this.statementsRepository.findByIdForUser(
      id,
      userId,
    );
    if (!statement)
      throw new NotFoundException(STATEMENTS_MESSAGES.STATEMENT_NOT_FOUND);
    return this.transactionsService.getStats(userId, id);
  }

  async getTransactions(
    id: string,
    userId: string,
    pagination: { page: number; limit: number },
  ) {
    const statement = await this.statementsRepository.findByIdForUser(
      id,
      userId,
    );
    if (!statement)
      throw new NotFoundException(STATEMENTS_MESSAGES.STATEMENT_NOT_FOUND);
    return this.transactionsService.findAll(userId, {
      ...pagination,
      statementId: id,
    });
  }

  async findAll(
    userId: string,
    { page, limit }: { page: number; limit: number },
  ) {
    const skip = (page - 1) * limit;

    const { statements, total } =
      await this.statementsRepository.findAllForUser(userId, {
        skip,
        take: limit,
      });

    return {
      data: statements,
      meta: {
        page,
        total,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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

    const contentHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const existing = await this.statementsRepository.findByUserAndHash(
      userId,
      contentHash,
    );
    if (existing) return existing;

    const storageKey = await this.storageService.upload(
      file.buffer,
      extname(file.originalname),
    );

    const statement = await this.statementsRepository.create({
      contentHash,
      filename: file.originalname,
      userId,
      storagePath: storageKey,
    });

    await this.queue.add(
      PROCESS_STATEMENT_QUEUE,
      { statementId: statement.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
    return statement;
  }
}

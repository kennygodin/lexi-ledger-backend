import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateUploadStatementInput {
  userId: string;
  filename: string;
  contentHash: string;
}

@Injectable()
export class StatementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.uploadStatement.findUnique({ where: { id } });
  }

  create(data: CreateUploadStatementInput) {
    return this.prisma.uploadStatement.create({
      data: {
        userId: data.userId,
        filename: data.filename,
        contentHash: data.contentHash,
      },
    });
  }

  findByUserAndHash(userId: string, contentHash: string) {
    return this.prisma.uploadStatement.findUnique({
      where: { userId_contentHash: { userId, contentHash } },
    });
  }
}

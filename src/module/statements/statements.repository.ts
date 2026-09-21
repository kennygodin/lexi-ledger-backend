import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatementStatus } from '../../generated/prisma/enums';

export interface CreateUploadStatementInput {
  userId: string;
  filename: string;
  contentHash: string;
  storagePath: string;
}

@Injectable()
export class StatementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(
    userId: string,
    { skip, take }: { skip: number; take: number },
  ) {
    const [statements, total] = await this.prisma.$transaction([
      this.prisma.uploadStatement.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.uploadStatement.count({
        where: { userId },
      }),
    ]);

    return { statements, total };
  }

  findById(id: string) {
    return this.prisma.uploadStatement.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: StatementStatus, failureReason?: string) {
    return this.prisma.uploadStatement.update({
      where: { id },
      data: { status, failureReason: failureReason ?? null },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.uploadStatement.findFirst({ where: { id, userId } });
  }

  create(data: CreateUploadStatementInput) {
    return this.prisma.uploadStatement.create({ data });
  }

  findByUserAndHash(userId: string, contentHash: string) {
    return this.prisma.uploadStatement.findUnique({
      where: { userId_contentHash: { userId, contentHash } },
    });
  }
}

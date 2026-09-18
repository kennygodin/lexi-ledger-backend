import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import * as crypto from 'crypto';
import {
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_MS,
} from './refresh-tokens.constants';

type RefreshResult =
  | { status: 'invalid' | 'reused' | 'expired' }
  | { status: 'valid'; userId: string; rawToken: string; expiresAt: Date };

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async revokeAllForUser(userId: string) {
    await this.refreshTokensRepository.revokeAllForUser(userId);
  }

  async revokeByRawToken(rawToken: string) {
    const existingToken =
      await this.refreshTokensRepository.findByTokenHash(rawToken);
    if (existingToken) {
      await this.refreshTokensRepository.revoke(existingToken.id);
    }
  }

  async validateAndRotate(rawToken: string): Promise<RefreshResult> {
    const tokenHash = hashToken(rawToken);
    const existingToken =
      await this.refreshTokensRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      return { status: 'invalid' };
    }

    if (existingToken.revokedAt) {
      await this.refreshTokensRepository.revokeAllForUser(existingToken.userId);
      return { status: 'reused' };
    }

    if (existingToken.expiresAt < new Date()) {
      return { status: 'expired' };
    }

    await this.refreshTokensRepository.revoke(existingToken.id);
    const { rawToken: newRawToken, expiresAt } = await this.issue(
      existingToken.userId,
    );
    return {
      status: 'valid',
      userId: existingToken.userId,
      rawToken: newRawToken,
      expiresAt,
    };
  }

  async issue(userId: string) {
    const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.refreshTokensRepository.create({
      userId,
      expiresAt,
      tokenHash,
    });

    return { rawToken, expiresAt };
  }
}

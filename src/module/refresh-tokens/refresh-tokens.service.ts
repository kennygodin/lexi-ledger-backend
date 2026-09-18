import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import * as crypto from 'crypto';
import {
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_MS,
} from './refresh-tokens.constants';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async validateAndRotate(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const existingToken =
      await this.refreshTokensRepository.findByTokenHash(tokenHash);
    return existingToken;

    // TODO: full rotation/reuse-detection logic
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

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { PasswordResetTokensRepository } from './password-reset-tokens.repository';
import {
  PASSWORD_RESET_TOKEN_MAX_ISSUE_ATTEMPTS,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from './password-reset-tokens.constants';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSixDigitToken(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

@Injectable()
export class PasswordResetTokensService {
  constructor(
    private readonly passwordResetTokensRespository: PasswordResetTokensRepository,
  ) {}

  async verify(rawToken: string): Promise<{ userId: string } | null> {
    const tokenHash = hashToken(rawToken);
    const existing =
      await this.passwordResetTokensRespository.findByTokenHash(tokenHash);

    if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
      return null;
    }

    await this.passwordResetTokensRespository.markAsUsed(existing.id);
    await this.passwordResetTokensRespository.invalidateActiveForUser(
      existing.userId,
      existing.id,
    );

    return { userId: existing.userId };
  }

  async issue(userId: string) {
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    for (
      let attempt = 0;
      attempt < PASSWORD_RESET_TOKEN_MAX_ISSUE_ATTEMPTS;
      attempt++
    ) {
      const rawToken = generateSixDigitToken();
      const tokenHash = hashToken(rawToken);

      try {
        await this.passwordResetTokensRespository.create({
          userId,
          tokenHash,
          expiresAt,
        });
        return { rawToken, expiresAt };
      } catch (error) {
        const isUniqueConstraintError =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002';
        if (!isUniqueConstraintError) throw error;
        // collision on tokenHash — extremely rare with a 900,000-value space, just retry
      }
    }

    throw new Error('Failed to generate a unique password reset token');
  }
}

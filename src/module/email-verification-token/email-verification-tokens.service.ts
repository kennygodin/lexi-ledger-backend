import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { EmailVerificationTokensRepository } from './email-verification-tokens.repository';
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  EMAIL_VERIFICATION_TOKEN_MAX_ISSUE_ATTEMPTS,
} from './email-verification-tokens.constants';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSixDigitToken(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

@Injectable()
export class EmailVerificationTokensService {
  constructor(private readonly repository: EmailVerificationTokensRepository) {}

  async issue(userId: string) {
    await this.repository.invalidateActiveForUser(userId);

    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

    for (
      let attempt = 0;
      attempt < EMAIL_VERIFICATION_TOKEN_MAX_ISSUE_ATTEMPTS;
      attempt++
    ) {
      const rawToken = generateSixDigitToken();
      const tokenHash = hashToken(rawToken);

      try {
        await this.repository.create({ userId, tokenHash, expiresAt });
        return { rawToken, expiresAt };
      } catch (error) {
        const isUniqueConstraintError =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002';
        if (!isUniqueConstraintError) throw error;
      }
    }

    throw new Error('Failed to generate a unique email verification token');
  }

  async verify(rawToken: string): Promise<{ userId: string } | null> {
    const tokenHash = hashToken(rawToken);
    const existing = await this.repository.findByTokenHash(tokenHash);

    if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
      return null;
    }

    await this.repository.markUsed(existing.id);
    return { userId: existing.userId };
  }
}

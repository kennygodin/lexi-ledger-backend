import { Module } from '@nestjs/common';
import { EmailVerificationTokensService } from './email-verification-tokens.service';
import { EmailVerificationTokensRepository } from './email-verification-tokens.repository';

@Module({
  providers: [
    EmailVerificationTokensService,
    EmailVerificationTokensRepository,
  ],
  exports: [EmailVerificationTokensService],
})
export class EmailVerificationTokensModule {}

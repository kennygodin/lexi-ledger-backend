import { Module } from '@nestjs/common';
import { PasswordResetTokensService } from './password-reset-tokens.service';
import { PasswordResetTokensRepository } from './password-reset-tokens.repository';

@Module({
  providers: [PasswordResetTokensService, PasswordResetTokensRepository],
  exports: [PasswordResetTokensService],
})
export class PasswordResetTokensModule {}

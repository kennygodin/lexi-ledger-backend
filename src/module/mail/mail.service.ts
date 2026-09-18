import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(to: string, token: string) {
    this.logger.log(`Verification token for ${to}: ${token}`);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    this.logger.log(`Password reset token for ${to}: ${token}`);
  }
}

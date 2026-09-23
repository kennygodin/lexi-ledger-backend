import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Resend(
      this.configService.getOrThrow<string>('mail.apiKey'),
    );
    this.from = this.configService.getOrThrow<string>('mail.from');
  }

  async sendVerificationEmail(to: string, token: string) {
    await this.client.emails.send({
      from: this.from,
      to,
      subject: 'Verify your email',
      html: `<p>Your verification code is: <strong>${token}</strong></p><p>This code expires in 24 hours.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    await this.client.emails.send({
      from: this.from,
      to,
      subject: 'Reset your password',
      html: `<p>Your password reset code is: <strong>${token}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
  }
}

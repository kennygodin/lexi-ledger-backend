import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM ?? 'noreply@mail.kennygodin.xyz',
}));

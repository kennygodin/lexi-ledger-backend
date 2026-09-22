import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

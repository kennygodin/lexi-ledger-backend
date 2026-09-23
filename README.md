# LexiLedger

An AI-powered expense tracker. Upload a bank statement PDF, and Gemini extracts and categorizes every transaction automatically — no manual entry. Track spending against category budgets, correct AI miscategorizations with a full audit trail, and see your finances on a dashboard.

Built as a hands-on rebuild of patterns from a prior production fintech backend: rotating refresh tokens, queue-backed async processing, database-enforced idempotency, and an honest (append-only) audit trail — applied from day one rather than bolted on later.

## What it does

1. **Upload** a bank statement PDF.
2. A background worker (BullMQ) picks it up, extracts the text, and sends it to **Gemini** with a structured-output schema.
3. Each transaction comes back typed, categorized, and validated — then persisted.
4. View everything on a **dashboard** (totals, category breakdown), set **per-category monthly budgets** and track spend against them, and **correct** any category the AI got wrong (with a full history of what changed and when).

## Features

- **Auth** — register/login/refresh with rotating refresh tokens and reuse-detection (a reused, already-rotated refresh token is treated as a theft signal, not just an error), email verification, forgot/reset password, logout-all-sessions, Redis-backed rate limiting on all five auth-abuse-prone endpoints.
- **Statement upload & parsing** — PDF upload → object storage (Cloudflare R2) → BullMQ queue → text extraction → Gemini structured extraction → validated, persisted transactions. Idempotent by content hash (re-uploading the same file returns the existing statement, no duplicate processing). Gemini failures distinguish transient (per-minute rate limit, worth retrying) from unrecoverable (daily quota exhausted, fails fast instead of burning more of a scarce quota).
- **Transactions** — paginated listing with date-range and per-statement filtering, category correction with an append-only audit trail (`TransactionCorrection`), per-transaction correction history.
- **Dashboard** — income/expense totals and category breakdown over any date range (or all-time).
- **Budgets** — per-category recurring monthly limits, with spend-vs-limit comparison scoped to a single calendar month (`?month=YYYY-MM`) — deliberately not an arbitrary date range, since comparing a "monthly" limit against a multi-month window would be meaningless.
- **Statement drill-down** — per-statement transaction list and stats (total/credit/debit/net).
- **Email** — verification and password-reset codes (6-digit, not links — the API needs to support non-web clients too) sent via Resend.
- **File storage** — statement PDFs live in Cloudflare R2 (S3-compatible), not local disk, so the app is actually deployable (local disk doesn't survive most hosting platforms' restarts/redeploys).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL + Prisma (7.x, `pg` driver adapter) |
| Queue | Redis + BullMQ (statement processing) |
| AI extraction | Gemini (structured JSON output) |
| Auth | JWT access tokens + rotating refresh tokens |
| File storage | Cloudflare R2 (S3-compatible API via `@aws-sdk/client-s3`) |
| Email | Resend |
| Rate limiting | `@nestjs/throttler`, Redis-backed |
| Validation | class-validator / class-transformer |
| Docs | Swagger (`/api/docs`) |

## Architecture notes

- **Repository/service split** — every feature module (`src/module/*`) separates Prisma calls (repository) from business logic (service); controllers stay thin. Cross-cutting infra (guards, decorators, interceptors, filters) lives in `src/common/`; infra with no HTTP surface of its own (Prisma, object storage) lives at `src/*` top-level, not under `src/module/`.
- **Response envelope** — a global interceptor wraps every response as `{ success, statusCode, data, meta? }`; a global exception filter normalizes every error as `{ success: false, statusCode, timestamp, path, message }`.
- **Idempotency** — statement uploads are deduplicated by SHA-256 content hash per user; re-uploading an identical file returns the existing record instead of reprocessing.
- **Audit trail, not silent overwrite** — correcting a transaction's category writes an append-only `TransactionCorrection` row (previous value, new value, timestamp) atomically alongside the update, rather than just overwriting the field.
- **Money as integers** — all amounts are stored in kobo (lowest currency unit), never floats, to avoid rounding drift; conversion to a display currency happens at the edges.

## Getting started

**Prerequisites:** Node.js, Bun, Docker.

```bash
# 1. Install dependencies
bun install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Copy the example env file and fill in the blanks
cp .env.example .env

# 4. Run migrations and generate the Prisma client
bunx prisma migrate dev --name init
bunx prisma generate

# 5. Start the dev server
bun run start:dev
```

API docs (Swagger) are then available at `http://localhost:3000/api/docs`.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_ACCESS_SECRET` | Yes | `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` | No | Default `15m` |
| `PORT` | No | Default `3000` |
| `NODE_ENV` | No | Default `development` |
| `CORS_ORIGINS` | No | Comma-separated, default allows `localhost:5173` |
| `REDIS_HOST` / `REDIS_PORT` | Yes | Matches `docker-compose.yml` |
| `GEMINI_API_KEY` | Yes | For statement extraction |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | No | Global rate-limit default, defaults 60s / 100 req |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Yes | Cloudflare R2 credentials |
| `RESEND_API_KEY` | Yes | Email sending |
| `MAIL_FROM` | Yes | Must be on a domain verified with Resend |

## Roadmap

Shipped: auth, statement upload/parsing, AI categorization, transactions + correction history, dashboard, budgets, rate limiting, R2 storage, real email delivery.

Deliberately deferred (v2+): parsing robustness across more statement formats, multi-account support, recurring-transaction detection, anomaly detection, a correction feedback loop back into categorization, data export, month-over-month comparison.

## License

UNLICENSED — personal/portfolio project.

# ---- Build stage ----
FROM oven/bun:1-slim AS builder
WORKDIR /app

# build tools needed to compile bcrypt's native binding
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN bunx prisma generate
RUN bun run build


# ---- Production stage ----
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json prisma.config.ts ./

EXPOSE 3000
CMD ["bun", "dist/main.js"]

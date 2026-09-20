-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'processing', 'parsed', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('food', 'transport', 'rent', 'utilities', 'subsciptions', 'shopping', 'entertainment', 'income', 'other');

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_batches_userId_idx" ON "upload_batches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "upload_batches_userId_contentHash_key" ON "upload_batches"("userId", "contentHash");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_batchId_idx" ON "transactions"("batchId");

-- AddForeignKey
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

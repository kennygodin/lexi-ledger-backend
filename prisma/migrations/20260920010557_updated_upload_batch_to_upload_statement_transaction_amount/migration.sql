/*
  Warnings:

  - The values [subsciptions] on the enum `TransactionCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `batchId` on the `transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - You are about to drop the `upload_batches` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `statementId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('pending', 'processing', 'parsed', 'failed');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionCategory_new" AS ENUM ('food', 'transport', 'rent', 'utilities', 'subscriptions', 'shopping', 'entertainment', 'income', 'other');
ALTER TABLE "transactions" ALTER COLUMN "category" TYPE "TransactionCategory_new" USING ("category"::text::"TransactionCategory_new");
ALTER TYPE "TransactionCategory" RENAME TO "TransactionCategory_old";
ALTER TYPE "TransactionCategory_new" RENAME TO "TransactionCategory";
DROP TYPE "public"."TransactionCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_batchId_fkey";

-- DropForeignKey
ALTER TABLE "upload_batches" DROP CONSTRAINT "upload_batches_userId_fkey";

-- DropIndex
DROP INDEX "transactions_batchId_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "batchId",
ADD COLUMN     "statementId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "upload_batches";

-- DropEnum
DROP TYPE "UploadStatus";

-- CreateTable
CREATE TABLE "upload_statements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" "StatementStatus" NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_statements_userId_idx" ON "upload_statements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "upload_statements_userId_contentHash_key" ON "upload_statements"("userId", "contentHash");

-- CreateIndex
CREATE INDEX "transactions_statementId_idx" ON "transactions"("statementId");

-- AddForeignKey
ALTER TABLE "upload_statements" ADD CONSTRAINT "upload_statements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "upload_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

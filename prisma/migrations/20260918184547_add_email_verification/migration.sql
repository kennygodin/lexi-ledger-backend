/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `email_verification_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

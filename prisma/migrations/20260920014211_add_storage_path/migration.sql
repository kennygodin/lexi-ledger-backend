/*
  Warnings:

  - Added the required column `storagePath` to the `upload_statements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "upload_statements" ADD COLUMN     "storagePath" TEXT NOT NULL;

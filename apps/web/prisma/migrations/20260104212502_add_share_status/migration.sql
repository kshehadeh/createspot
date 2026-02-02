-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PRIVATE', 'PROFILE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "shareStatus" "ShareStatus" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "Submission_shareStatus_idx" ON "Submission"("shareStatus");

-- Clear prompt association before dropping Prompt (isPortfolio/shareStatus unchanged)
UPDATE "Submission" SET "promptId" = NULL, "wordIndex" = NULL WHERE "promptId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_promptId_fkey";

-- DropIndex
DROP INDEX "Submission_promptId_idx";

-- DropIndex
DROP INDEX "Submission_userId_promptId_wordIndex_key";

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "promptId",
DROP COLUMN "wordIndex";

-- DropTable
DROP TABLE "Prompt";

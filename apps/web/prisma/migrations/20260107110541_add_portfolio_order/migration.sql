-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "portfolioOrder" INTEGER;

-- CreateIndex
CREATE INDEX "Submission_userId_isPortfolio_portfolioOrder_idx" ON "Submission"("userId", "isPortfolio", "portfolioOrder");

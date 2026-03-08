-- CreateIndex
CREATE INDEX "Submission_shareStatus_isPortfolio_createdAt_idx" ON "Submission"("shareStatus", "isPortfolio", "createdAt");

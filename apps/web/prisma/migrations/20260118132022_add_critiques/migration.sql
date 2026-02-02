-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "critiquesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Critique" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "critiquerId" TEXT NOT NULL,
    "critique" TEXT NOT NULL,
    "response" TEXT,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Critique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Critique_submissionId_idx" ON "Critique"("submissionId");

-- CreateIndex
CREATE INDEX "Critique_critiquerId_idx" ON "Critique"("critiquerId");

-- CreateIndex
CREATE INDEX "Critique_submissionId_critiquerId_idx" ON "Critique"("submissionId", "critiquerId");

-- AddForeignKey
ALTER TABLE "Critique" ADD CONSTRAINT "Critique_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Critique" ADD CONSTRAINT "Critique_critiquerId_fkey" FOREIGN KEY ("critiquerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

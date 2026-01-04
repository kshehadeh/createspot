-- AlterTable
ALTER TABLE "User" ADD COLUMN "featuredSubmissionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_featuredSubmissionId_key" ON "User"("featuredSubmissionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_featuredSubmissionId_fkey" FOREIGN KEY ("featuredSubmissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;



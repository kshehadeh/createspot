-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isPortfolio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "promptId" DROP NOT NULL,
ALTER COLUMN "wordIndex" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "viewerIpHash" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionView" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "viewerIpHash" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileView_profileUserId_idx" ON "ProfileView"("profileUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileView_profileUserId_viewerUserId_key" ON "ProfileView"("profileUserId", "viewerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileView_profileUserId_viewerIpHash_key" ON "ProfileView"("profileUserId", "viewerIpHash");

-- CreateIndex
CREATE INDEX "SubmissionView_submissionId_idx" ON "SubmissionView"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionView_submissionId_viewerUserId_key" ON "SubmissionView"("submissionId", "viewerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionView_submissionId_viewerIpHash_key" ON "SubmissionView"("submissionId", "viewerIpHash");

-- CreateIndex
CREATE INDEX "Submission_userId_isPortfolio_idx" ON "Submission"("userId", "isPortfolio");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionView" ADD CONSTRAINT "SubmissionView_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionView" ADD CONSTRAINT "SubmissionView_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

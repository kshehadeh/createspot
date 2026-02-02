-- CreateTable
CREATE TABLE "Exhibit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "curatorId" TEXT NOT NULL,
    "featuredSubmissionId" TEXT,
    "allowedViewTypes" TEXT[] DEFAULT ARRAY['gallery', 'constellation', 'global']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exhibit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExhibitSubmission" (
    "id" TEXT NOT NULL,
    "exhibitId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExhibitSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exhibit_featuredSubmissionId_key" ON "Exhibit"("featuredSubmissionId");

-- CreateIndex
CREATE INDEX "Exhibit_startTime_endTime_idx" ON "Exhibit"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Exhibit_isActive_idx" ON "Exhibit"("isActive");

-- CreateIndex
CREATE INDEX "ExhibitSubmission_exhibitId_order_idx" ON "ExhibitSubmission"("exhibitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExhibitSubmission_exhibitId_submissionId_key" ON "ExhibitSubmission"("exhibitId", "submissionId");

-- AddForeignKey
ALTER TABLE "Exhibit" ADD CONSTRAINT "Exhibit_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhibit" ADD CONSTRAINT "Exhibit_featuredSubmissionId_fkey" FOREIGN KEY ("featuredSubmissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExhibitSubmission" ADD CONSTRAINT "ExhibitSubmission_exhibitId_fkey" FOREIGN KEY ("exhibitId") REFERENCES "Exhibit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExhibitSubmission" ADD CONSTRAINT "ExhibitSubmission_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

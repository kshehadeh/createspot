-- CreateTable
CREATE TABLE "Progression" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "text" TEXT,
    "comment" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Progression_submissionId_idx" ON "Progression"("submissionId");

-- CreateIndex
CREATE INDEX "Progression_submissionId_order_idx" ON "Progression"("submissionId", "order");

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

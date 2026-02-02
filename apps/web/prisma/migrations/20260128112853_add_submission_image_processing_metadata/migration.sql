-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "imageProcessedAt" TIMESTAMP(3),
ADD COLUMN     "imageProcessingMetadata" JSONB;

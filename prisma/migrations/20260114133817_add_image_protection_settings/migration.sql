-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enableWatermark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "protectFromAI" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "protectFromDownload" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "watermarkPosition" TEXT NOT NULL DEFAULT 'bottom-right';

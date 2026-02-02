-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailFeatureUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailOnFavorite" BOOLEAN NOT NULL DEFAULT true;

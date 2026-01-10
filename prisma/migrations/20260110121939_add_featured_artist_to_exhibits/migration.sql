-- AlterTable
ALTER TABLE "Exhibit" ADD COLUMN     "featuredArtistId" TEXT;

-- AddForeignKey
ALTER TABLE "Exhibit" ADD CONSTRAINT "Exhibit_featuredArtistId_fkey" FOREIGN KEY ("featuredArtistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

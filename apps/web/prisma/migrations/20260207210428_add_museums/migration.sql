-- CreateTable
CREATE TABLE "MuseumArtwork" (
    "id" TEXT NOT NULL,
    "globalId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "artists" JSONB NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "additionalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediums" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediumDisplay" TEXT,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "classifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dateCreated" TEXT,
    "dateStart" INTEGER,
    "dateEnd" INTEGER,
    "dimensions" TEXT,
    "department" TEXT,
    "culture" TEXT,
    "creditLine" TEXT,
    "provenance" TEXT,
    "isPublicDomain" BOOLEAN NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawMetadata" JSONB,
    "curatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "MuseumArtwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumSource" (
    "id" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEnv" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "config" JSONB,

    CONSTRAINT "MuseumSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuseumArtwork_globalId_key" ON "MuseumArtwork"("globalId");

-- CreateIndex
CREATE INDEX "MuseumArtwork_museumId_idx" ON "MuseumArtwork"("museumId");

-- CreateIndex
CREATE INDEX "MuseumArtwork_globalId_idx" ON "MuseumArtwork"("globalId");

-- CreateIndex
CREATE INDEX "MuseumArtwork_genres_idx" ON "MuseumArtwork"("genres");

-- CreateIndex
CREATE INDEX "MuseumArtwork_mediums_idx" ON "MuseumArtwork"("mediums");

-- CreateIndex
CREATE INDEX "MuseumArtwork_classifications_idx" ON "MuseumArtwork"("classifications");

-- CreateIndex
CREATE INDEX "MuseumArtwork_tags_idx" ON "MuseumArtwork"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "MuseumSource_museumId_key" ON "MuseumSource"("museumId");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tutorial" JSONB NOT NULL DEFAULT '{"status": "enabled", "home": {}}';

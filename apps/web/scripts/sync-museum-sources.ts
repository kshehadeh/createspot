#!/usr/bin/env bun
/**
 * Sync Museum Sources
 *
 * Updates the MuseumSource table with the museums that are currently supported
 * in the museum adapter classes. Uses museum.id as the unique identifier.
 *
 * Usage:
 *   bun run scripts/sync-museum-sources.ts
 */

import { prisma } from "@/lib/prisma";
import { MuseumCollections } from "@/scripts/museums";

interface MuseumMetadata {
  id: string;
  name: string;
  baseUrl: string;
}

/**
 * Data source path per museum (SQLite database path).
 * Stored in MuseumSource.baseUrl for reference.
 */
function getMuseumMetadata(): MuseumMetadata[] {
  const collections = new MuseumCollections();

  return collections.museums.map((museum) => {
    let baseUrl = "";
    switch (museum.id) {
      case "cleveland":
        baseUrl = "file://data/museums/cleveland/processed/opendata.db";
        break;
      case "artic":
        baseUrl = "file://data/museums/artic/processed/opendata.db";
        break;
      case "nga":
        baseUrl = "file://data/museums/nga/processed/opendata.db";
        break;
      default:
        baseUrl = "file://unknown";
    }
    return {
      id: museum.id,
      name: museum.name,
      baseUrl,
    };
  });
}

async function syncMuseumSources() {
  console.log("Syncing museum sources...\n");

  const museums = getMuseumMetadata();
  let created = 0;
  let updated = 0;
  let deactivated = 0;

  // Upsert each museum
  for (const museum of museums) {
    const existing = await prisma.museumSource.findUnique({
      where: { museumId: museum.id },
    });

    if (existing) {
      await prisma.museumSource.update({
        where: { museumId: museum.id },
        data: {
          name: museum.name,
          baseUrl: museum.baseUrl,
          apiKeyEnv: null,
          isActive: true,
        },
      });
      console.log(`✓ Updated: ${museum.name} (${museum.id})`);
      updated++;
    } else {
      await prisma.museumSource.create({
        data: {
          museumId: museum.id,
          name: museum.name,
          baseUrl: museum.baseUrl,
          isActive: true,
        },
      });
      console.log(`+ Created: ${museum.name} (${museum.id})`);
      created++;
    }
  }

  // Deactivate any museum sources that are no longer in the code
  const activeMuseumIds = museums.map((m) => m.id);
  const deactivatedRecords = await prisma.museumSource.updateMany({
    where: {
      museumId: { notIn: activeMuseumIds },
      isActive: true,
    },
    data: { isActive: false },
  });

  deactivated = deactivatedRecords.count;
  if (deactivated > 0) {
    console.log(`\n⚠ Deactivated ${deactivated} museum(s) no longer in code`);
  }

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("Summary:");
  console.log(`  Created:     ${created}`);
  console.log(`  Updated:     ${updated}`);
  console.log(`  Deactivated: ${deactivated}`);
  console.log(`  Total:       ${museums.length} active museums`);
  console.log(`${"=".repeat(50)}`);
}

async function main() {
  try {
    await syncMuseumSources();
  } catch (error) {
    console.error("Error syncing museum sources:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

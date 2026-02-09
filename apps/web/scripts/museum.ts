#!/usr/bin/env bun
/**
 * Search and load museum collection data.
 *
 * Actions:
 *   search  Search across registered museum collections (local SQLite). Default.
 *   load    Load raw museum data into SQLite. Use --museum to load only specific museums.
 *
 * Search usage:
 *   bun scripts/museum.ts search --query KEYWORD [options]
 *   bun scripts/museum.ts -q landscape --limit 10
 *   bun scripts/museum.ts -q landscape -l 10 --museum cleveland --museum artic
 *   bun scripts/museum.ts -q sunset --limit 5 --save
 *
 * Load usage:
 *   bun scripts/museum.ts load                    # load all museums (default source paths)
 *   bun scripts/museum.ts load --museum artic    # load only Art Institute of Chicago
 *   bun scripts/museum.ts load --museum cleveland --museum nga
 *
 * Search options:
 *   --limit applies per museum (e.g. --limit 10 with 2 museums = up to 20 results).
 *   --save  Upsert results into MuseumArtwork table.
 *   --prod  Use production database (requires PRODUCTION_DATABASE_URL).
 */

import { program } from "commander";
import { config } from "dotenv";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "node:fs";
import { Prisma } from "@/app/generated/prisma/client";
import { MuseumCollections, normalizeArtistName } from "@/scripts/museums";
import type { ArtworkResult } from "@/scripts/museums";
import type { Museum } from "@/scripts/museums/museum";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from repo root when run from apps/web
config({ path: resolve(__dirname, "../../.env") });
config(); // fallback: cwd .env

// Use production DB if --prod is passed (must set DATABASE_URL before Prisma is loaded)
const prodIndex = process.argv.indexOf("--prod");
if (prodIndex !== -1) {
  const prodUrl = process.env.PRODUCTION_DATABASE_URL;
  if (!prodUrl) {
    console.error(
      "Error: --prod requires PRODUCTION_DATABASE_URL to be set in the environment.",
    );
    process.exit(1);
  }
  process.env.DATABASE_URL = prodUrl;
}

function formatArtwork(a: ArtworkResult, index: number): string {
  const artistNames = a.artists.length
    ? a.artists.map((x) => x.name).join(", ")
    : "—";
  const year = a.dateStart ?? a.dateEnd ?? a.dateCreated?.slice(0, 4) ?? "—";
  return [
    `${index + 1}. ${a.title}`,
    `   Museum: ${a.museumId} | ID: ${a.localId}`,
    `   Artist(s): ${artistNames} | Date: ${year}`,
    `   ${(a.mediumDisplay ?? a.mediums.join(", ")) || "—"}`,
    `   ${a.imageUrl ? "✓ Image" : "✗ No image"} | PD: ${a.isPublicDomain}`,
    `   Image (direct): ${a.imageUrl || "—"}`,
    `   Museum page:   ${a.sourceUrl}`,
  ].join("\n");
}

function normalizeTitle(title: string | string[] | undefined): string {
  if (title == null) return "Untitled";
  if (Array.isArray(title)) return title[0] ?? "Untitled";
  return title;
}

function normalizeDescription(
  desc: string | string[] | undefined,
): string | null {
  if (desc == null) return null;
  if (Array.isArray(desc)) return desc[0] ?? null;
  return desc;
}

function artworkToMuseumArtworkData(a: ArtworkResult) {
  const artists = a.artists.map((artist) => ({
    ...artist,
    name: normalizeArtistName(artist.name) || artist.name,
  }));

  return {
    globalId: a.globalId,
    localId: a.localId,
    museumId: a.museumId,
    title: normalizeTitle(a.title as string | string[] | undefined),
    description: normalizeDescription(
      a.description as string | string[] | undefined,
    ),
    artists: artists as object,
    imageUrl: a.imageUrl,
    thumbnailUrl: a.thumbnailUrl ?? null,
    additionalImages: a.additionalImages ?? [],
    mediums: a.mediums,
    mediumDisplay: a.mediumDisplay ?? null,
    genres: a.genres,
    classifications: a.classifications,
    tags: a.tags,
    dateCreated: a.dateCreated ?? null,
    dateStart:
      a.dateStart != null && Number.isInteger(a.dateStart) ? a.dateStart : null,
    dateEnd:
      a.dateEnd != null && Number.isInteger(a.dateEnd) ? a.dateEnd : null,
    dimensions: a.dimensions ?? null,
    department: a.department ?? null,
    culture: a.culture ?? null,
    creditLine: a.creditLine ?? null,
    provenance: a.provenance ?? null,
    isPublicDomain: a.isPublicDomain,
    sourceUrl: a.sourceUrl,
    rawMetadata:
      a.rawMetadata != null
        ? (a.rawMetadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
  };
}

/** Check that the default source path for a museum exists (file or dir as appropriate). */
function validateSourcePath(museum: Museum): { ok: boolean; message?: string } {
  const path = museum.getDefaultSourcePath();
  if (!existsSync(path)) {
    return { ok: false, message: `Source path does not exist: ${path}` };
  }
  // NGA expects a directory with objects.csv
  if (museum.id === "nga") {
    const objectsPath = join(path, "objects.csv");
    if (!existsSync(objectsPath)) {
      return {
        ok: false,
        message: `NGA data directory must contain objects.csv: ${path}`,
      };
    }
  }
  return { ok: true };
}

async function runSearch(opts: {
  query: string;
  limit: number;
  genre: string[];
  artist: string[];
  medium: string[];
  classification: string[];
  museum: string[];
  dateStart?: number;
  dateEnd?: number;
  save: boolean;
}): Promise<void> {
  const keyword = opts.query ?? "";
  const limit = opts.limit ?? 15;
  const genres = opts.genre ?? [];
  const artists = opts.artist ?? [];
  const mediums = opts.medium ?? [];
  const classifications = opts.classification ?? [];
  const museums = opts.museum ?? [];
  const saveToDb = opts.save === true;
  const dateRange =
    opts.dateStart != null && opts.dateEnd != null
      ? { start: opts.dateStart, end: opts.dateEnd }
      : undefined;

  const filters: string[] = [];
  if (museums.length > 0) filters.push(`museums: ${museums.join(", ")}`);
  if (genres.length > 0) filters.push(`genre: ${genres.join(", ")}`);
  if (artists.length > 0) filters.push(`artist: ${artists.join(", ")}`);
  if (mediums.length > 0) filters.push(`medium: ${mediums.join(", ")}`);
  if (classifications.length > 0)
    filters.push(`classification: ${classifications.join(", ")}`);
  if (dateRange) filters.push(`date: ${dateRange.start}–${dateRange.end}`);
  const filterLabel = filters.length > 0 ? `, ${filters.join(", ")}` : "";

  console.log(
    `Searching museums for "${keyword}" (limit: ${limit} per museum${filterLabel})…\n`,
  );

  const collections = new MuseumCollections();
  const searchOptions = {
    query: keyword,
    limit,
    hasImageOnly: true,
    ...(museums.length > 0 ? { museums } : {}),
    ...(genres.length > 0 ? { genres } : {}),
    ...(artists.length > 0 ? { artists } : {}),
    ...(mediums.length > 0 ? { mediums } : {}),
    ...(classifications.length > 0 ? { classifications } : {}),
    ...(dateRange ? { dateRange } : {}),
  };

  const dataSources = collections.getDataSources(searchOptions);
  if (dataSources.length > 0) {
    console.log("Data source per museum:");
    for (const { museumId, name, dataSource } of dataSources) {
      console.log(`  ${museumId} (${name}): ${dataSource}`);
    }
    console.log();
  }

  collections.searchProgress = {
    onMuseumStart(museumId, name) {
      console.log(`Searching ${name} (${museumId})…`);
    },
    onMuseumComplete(museumId, name, resultCount) {
      console.log(`  → ${name}: ${resultCount} result(s)`);
    },
  };

  const results = await collections.search(searchOptions);

  console.log(`\nFound ${results.length} result(s):\n`);
  results.forEach((artwork, i) => {
    console.log(formatArtwork(artwork, i));
    console.log();
  });

  if (saveToDb && results.length > 0) {
    const { prisma } = await import("@/lib/prisma");
    const globalIds = results.map((r) => r.globalId);
    const existing = await prisma.museumArtwork.findMany({
      where: { globalId: { in: globalIds } },
      select: { globalId: true },
    });
    const existingSet = new Set(existing.map((e) => e.globalId));
    for (const a of results) {
      const data = artworkToMuseumArtworkData(a);
      await prisma.museumArtwork.upsert({
        where: { globalId: a.globalId },
        create: data,
        update: { ...data, lastSyncedAt: new Date() },
      });
    }
    const newCount = results.length - existingSet.size;
    const updatedCount = existingSet.size;
    console.log(
      `Saved ${results.length} artwork(s) to database (${newCount} new, ${updatedCount} updated).`,
    );
    await prisma.$disconnect();
  }
}

async function runLoad(opts: { museum: string[] }): Promise<void> {
  const collections = new MuseumCollections();
  const museumIds = opts.museum ?? [];
  const museums =
    museumIds.length > 0
      ? museumIds
          .map((id) => collections.museums.find((m) => m.id === id))
          .filter((m): m is Museum => Boolean(m))
      : collections.museums;

  if (museums.length === 0) {
    if (museumIds.length > 0) {
      console.error(
        `Unknown museum(s): ${museumIds.join(", ")}. Valid: artic, cleveland, nga`,
      );
    } else {
      console.error("No museums registered.");
    }
    process.exit(1);
  }

  for (const museum of museums) {
    const validation = validateSourcePath(museum);
    if (!validation.ok) {
      console.error(`${museum.id} (${museum.name}): ${validation.message}`);
      process.exit(1);
    }
  }

  for (const museum of museums) {
    const sourcePath = museum.getDefaultSourcePath();
    console.log(`Loading ${museum.name} (${museum.id}) from ${sourcePath}…`);
    try {
      await museum.loadDataIntoSqlite(sourcePath);
      console.log(
        `  → ${museum.id}: done. Database: ${museum.getProcessedDbPath()}\n`,
      );
    } catch (err) {
      console.error(`  → ${museum.id}: failed.`, err);
      process.exit(1);
    }
  }

  console.log(`Loaded ${museums.length} museum(s).`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

program
  .name("museum")
  .description("Search and load museum collection data")
  .command("search")
  .description("Search across registered museum collections (default)")
  .option("-q, --query <keyword>", "Search keyword", "")
  .option(
    "-l, --limit <number>",
    "Max results per museum (1–50)",
    (v) => Math.min(50, Math.max(1, Number.parseInt(String(v), 10) || 100)),
    100,
  )
  .option(
    "-g, --genre <genre>",
    "Filter by genre (repeat for multiple)",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .option(
    "-a, --artist <name>",
    "Filter by artist name (repeat for multiple)",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .option(
    "-m, --medium <medium>",
    "Filter by medium/technique (repeat for multiple)",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .option(
    "-c, --classification <classification>",
    "Filter by classification (repeat for multiple)",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .option(
    "--museum <id>",
    "Limit search to museum(s): artic, cleveland, nga (repeat for multiple)",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .option("--date-start <year>", "Filter by date range start (year)", (v) =>
    Number.parseInt(String(v), 10),
  )
  .option("--date-end <year>", "Filter by date range end (year)", (v) =>
    Number.parseInt(String(v), 10),
  )
  .option("--save", "Upsert results into MuseumArtwork table", false)
  .option(
    "--prod",
    "Use production database (requires PRODUCTION_DATABASE_URL in environment)",
    false,
  )
  .action(async (opts) => {
    await runSearch(opts);
  });

program
  .command("load")
  .description(
    "Load raw museum data into SQLite (uses each museum's default source path)",
  )
  .option(
    "--museum <id>",
    "Load only this museum (repeat for multiple). Omit to load all.",
    (val: string, prev: string[]) => prev.concat([val]),
    [] as string[],
  )
  .action(async (opts) => {
    await runLoad(opts);
  });

// Default to "search" when first arg is an option (e.g. -q landscape)
const args = process.argv.slice(2);
if (args.length > 0 && args[0].startsWith("-")) {
  process.argv.splice(2, 0, "search");
}

program.parse();

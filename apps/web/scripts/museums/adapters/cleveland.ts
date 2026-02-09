import { Database } from "bun:sqlite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import type { Artist, ArtworkResult, SearchOptions } from "@/lib/museums/types";
import { Museum } from "../museum";
import { normalizeStringArray } from "../utils/normalize";
import { parseMediums } from "../utils/parse-medium";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_MUSEUM_DIR = join(__dirname, "../../../data/museums/cleveland");
const PROCESSED_DIR = join(DATA_MUSEUM_DIR, "processed");
const DEFAULT_DB_PATH = join(PROCESSED_DIR, "opendata.db");
const DEFAULT_SOURCE_PATH = join(DATA_MUSEUM_DIR, "raw", "data.json");

function getDbPath(): string {
  return process.env.CMA_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
}

let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    const path = getDbPath();
    dbInstance = new Database(path, { readonly: true });
  }
  return dbInstance;
}

// ---------------------------------------------------------------------------
// Interfaces for SQLite row shapes
// ---------------------------------------------------------------------------

interface CmaArtworkRow {
  id: number;
  accession_number: string | null;
  title: string | null;
  description: string | null;
  share_license_status: string | null;
  technique: string | null;
  type: string | null;
  department: string | null;
  measurements: string | null;
  creditline: string | null;
  url: string | null;
  images: string | null; // JSON
  creation_date: string | null;
  creation_date_earliest: number | null;
  creation_date_latest: number | null;
}

interface CmaCreatorRow {
  artwork_id: number;
  creator_id: number | null;
  description: string | null;
  role: string | null;
  biography: string | null;
  birth_year: string | null;
  death_year: string | null;
}

interface CmaCultureRow {
  artwork_id: number;
  culture: string;
}

interface CmaAlternateImageRow {
  artwork_id: number;
  web: string | null; // JSON
  print: string | null; // JSON
  full_image: string | null; // JSON
}

interface CmaImageAsset {
  url?: string;
}

interface CmaImages {
  web?: CmaImageAsset;
  print?: CmaImageAsset;
  full?: CmaImageAsset;
}

/** Cleveland "type" values (object classification) used for genre filtering. */
const CLEVELAND_TYPES = new Set([
  "painting",
  "sculpture",
  "print",
  "drawing",
  "photograph",
  "ceramic",
  "textile",
  "metalwork",
  "furniture",
  "glass",
  "drawings",
  "prints",
  "photographs",
  "paintings",
  "sculptures",
  "ceramics",
  "textiles",
]);

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

function buildSearchWhere(
  options: SearchOptions,
  params: (string | number)[],
): string {
  const conditions: string[] = [];

  const query = (options.query ?? "").trim();
  if (query) {
    conditions.push("(a.title LIKE ? OR a.description LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like);
  }

  if (options.artists?.length) {
    const artist = options.artists[0];
    const words = artist
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length > 0) {
      const wordConditions = words.map(() => "c.description LIKE ?");
      conditions.push(
        `a.id IN (
          SELECT c.artwork_id FROM creators c
          WHERE ${wordConditions.join(" AND ")}
        )`,
      );
      for (const word of words) {
        params.push(`%${word}%`);
      }
    }
  }

  if (options.genres?.length) {
    const genreAsType = options.genres.find((g) =>
      CLEVELAND_TYPES.has(g.toLowerCase()),
    );
    if (genreAsType) {
      conditions.push("LOWER(a.type) = ?");
      params.push(genreAsType.toLowerCase());
    }
  }

  if (options.mediums?.length) {
    conditions.push("a.technique LIKE ?");
    params.push(`%${options.mediums[0]}%`);
  }

  if (options.publicDomainOnly) {
    conditions.push("a.share_license_status = 'CC0'");
  }

  if (options.dateRange) {
    conditions.push(
      "a.creation_date_earliest <= ? AND (a.creation_date_latest >= ? OR a.creation_date_latest IS NULL)",
    );
    params.push(options.dateRange.end, options.dateRange.start);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

// ---------------------------------------------------------------------------
// Image parsing helpers
// ---------------------------------------------------------------------------

function parseImages(json: string | null): CmaImages | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as CmaImages;
  } catch {
    return null;
  }
}

function parseImageAsset(json: string | null): CmaImageAsset | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as CmaImageAsset;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Row → ArtworkResult
// ---------------------------------------------------------------------------

function rowToArtworkResult(
  row: CmaArtworkRow,
  artists: Artist[],
  cultures: string[],
  additionalImages: string[],
  museumId: string,
  createGlobalId: (localId: string) => string,
): ArtworkResult {
  const images = parseImages(row.images);
  const imageUrl =
    images?.web?.url ?? images?.full?.url ?? images?.print?.url ?? "";
  const thumbnailUrl = images?.web?.url ?? imageUrl;

  const { mediums, mediumDisplay } = parseMediums(row.technique ?? undefined);
  const typeValues = normalizeStringArray([row.type]);
  const sourceUrl =
    row.url ??
    (row.accession_number
      ? `https://www.clevelandart.org/art/${row.accession_number}`
      : `https://www.clevelandart.org/art/${row.id}`);

  return {
    globalId: createGlobalId(String(row.id)),
    localId: String(row.id),
    museumId,
    title: row.title?.trim() || "Untitled",
    description: row.description ?? undefined,
    artists,
    imageUrl,
    thumbnailUrl: thumbnailUrl || undefined,
    additionalImages,
    mediums,
    mediumDisplay,
    genres: typeValues,
    classifications: typeValues,
    tags: [],
    dateCreated: row.creation_date ?? undefined,
    dateStart: row.creation_date_earliest ?? undefined,
    dateEnd: row.creation_date_latest ?? undefined,
    dimensions: row.measurements ?? undefined,
    department: row.department ?? undefined,
    culture: cultures[0] ?? undefined,
    creditLine: row.creditline ?? undefined,
    isPublicDomain: row.share_license_status === "CC0",
    sourceUrl,
    rawMetadata: {
      id: row.id,
      accession_number: row.accession_number,
      type: row.type,
    },
  };
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClevelandMuseum extends Museum {
  readonly id = "cleveland";
  readonly name = "Cleveland Museum of Art";

  getDataSource(_options: SearchOptions): string {
    return this.getProcessedDbPath();
  }

  getDefaultSourcePath(): string {
    return DEFAULT_SOURCE_PATH;
  }

  getProcessedDbPath(): string {
    return process.env.CMA_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
  }

  async loadDataIntoSqlite(sourcePath: string): Promise<void> {
    const text = await Bun.file(sourcePath).text();
    const data = JSON.parse(text) as Record<string, unknown>[];
    if (data.length === 0) throw new Error(`No records in ${sourcePath}`);

    const dbPath = this.getProcessedDbPath();
    try {
      if (existsSync(dbPath)) unlinkSync(dbPath);
    } catch {}
    mkdirSync(PROCESSED_DIR, { recursive: true });

    const db = new Database(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = OFF");
    db.exec("PRAGMA foreign_keys = OFF");
    for (const stmt of CMA_LOADER_SCHEMA.split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      db.exec(stmt + ";");
    }
    db.exec("PRAGMA foreign_keys = ON");

    const insertArtwork = db.prepare(`
    INSERT INTO artworks (id, accession_number, share_license_status, tombstone, current_location, title, title_in_original_language, series, series_in_original_language, creation_date, creation_date_earliest, creation_date_latest, technique, department, collection, type, measurements, dimensions, state_of_the_work, edition_of_the_work, copyright, find_spot, did_you_know, description, external_resources, catalogue_raisonne, url, images, creditline, sketchfab_id, sketchfab_url, gallery_donor_text, updated_at)
    VALUES ($id, $accession_number, $share_license_status, $tombstone, $current_location, $title, $title_in_original_language, $series, $series_in_original_language, $creation_date, $creation_date_earliest, $creation_date_latest, $technique, $department, $collection, $type, $measurements, $dimensions, $state_of_the_work, $edition_of_the_work, $copyright, $find_spot, $did_you_know, $description, $external_resources, $catalogue_raisonne, $url, $images, $creditline, $sketchfab_id, $sketchfab_url, $gallery_donor_text, $updated_at)
  `);
    const insertArtistsTag = db.prepare(
      "INSERT INTO artists_tags (artwork_id, tag) VALUES ($artwork_id, $tag)",
    );
    const insertCulture = db.prepare(
      "INSERT INTO cultures (artwork_id, culture) VALUES ($artwork_id, $culture)",
    );
    const insertSupportMaterial = db.prepare(
      "INSERT INTO support_materials (artwork_id, description, watermarks) VALUES ($artwork_id, $description, $watermarks)",
    );
    const insertInscription = db.prepare(
      "INSERT INTO inscriptions (artwork_id, inscription, inscription_translation, inscription_remark, sortorder) VALUES ($artwork_id, $inscription, $inscription_translation, $inscription_remark, $sortorder)",
    );
    const insertExhibitionCurrent = db.prepare(
      "INSERT INTO exhibitions_current (artwork_id, exhibition_id, title, description, opening_date) VALUES ($artwork_id, $exhibition_id, $title, $description, $opening_date)",
    );
    const insertExhibitionLegacy = db.prepare(
      "INSERT INTO exhibitions_legacy (artwork_id, description, opening_date) VALUES ($artwork_id, $description, $opening_date)",
    );
    const insertProvenance = db.prepare(
      "INSERT INTO provenance (artwork_id, description, citations, footnotes, date, sortorder) VALUES ($artwork_id, $description, $citations, $footnotes, $date, $sortorder)",
    );
    const insertRelatedWork = db.prepare(
      "INSERT INTO related_works (artwork_id, related_work_id, description, relationship) VALUES ($artwork_id, $related_work_id, $description, $relationship)",
    );
    const insertFormerAccession = db.prepare(
      "INSERT INTO former_accession_numbers (artwork_id, accession_number) VALUES ($artwork_id, $accession_number)",
    );
    const insertCitation = db.prepare(
      "INSERT INTO citations (artwork_id, citation, page_number, url) VALUES ($artwork_id, $citation, $page_number, $url)",
    );
    const insertAlternateImage = db.prepare(
      "INSERT INTO alternate_images (artwork_id, date_created, annotation, web, print, full_image) VALUES ($artwork_id, $date_created, $annotation, $web, $print, $full_image)",
    );
    const insertCreator = db.prepare(
      "INSERT INTO creators (artwork_id, creator_id, description, extent, qualifier, role, biography, name_in_original_language, birth_year, death_year) VALUES ($artwork_id, $creator_id, $description, $extent, $qualifier, $role, $biography, $name_in_original_language, $birth_year, $death_year)",
    );

    const insertAll = db.transaction(() => {
      for (const record of data) {
        const artworkId = record.id as number;
        insertArtwork.run({
          $id: artworkId,
          $accession_number: (record.accession_number as string) ?? null,
          $share_license_status:
            (record.share_license_status as string) ?? null,
          $tombstone: (record.tombstone as string) ?? null,
          $current_location: (record.current_location as string) ?? null,
          $title: (record.title as string) ?? null,
          $title_in_original_language:
            (record.title_in_original_language as string) ?? null,
          $series: (record.series as string) ?? null,
          $series_in_original_language:
            (record.series_in_original_language as string) ?? null,
          $creation_date: (record.creation_date as string) ?? null,
          $creation_date_earliest:
            (record.creation_date_earliest as number) ?? null,
          $creation_date_latest:
            (record.creation_date_latest as number) ?? null,
          $technique: (record.technique as string) ?? null,
          $department: (record.department as string) ?? null,
          $collection: (record.collection as string) ?? null,
          $type: (record.type as string) ?? null,
          $measurements: (record.measurements as string) ?? null,
          $dimensions: loadJsonOrNull(record.dimensions),
          $state_of_the_work: (record.state_of_the_work as string) ?? null,
          $edition_of_the_work: (record.edition_of_the_work as string) ?? null,
          $copyright: (record.copyright as string) ?? null,
          $find_spot: (record.find_spot as string) ?? null,
          $did_you_know: (record.did_you_know as string) ?? null,
          $description: (record.description as string) ?? null,
          $external_resources: loadJsonOrNull(record.external_resources),
          $catalogue_raisonne: (record.catalogue_raisonne as string) ?? null,
          $url: (record.url as string) ?? null,
          $images: loadJsonOrNull(record.images),
          $creditline: (record.creditline as string) ?? null,
          $sketchfab_id: (record.sketchfab_id as string) ?? null,
          $sketchfab_url: (record.sketchfab_url as string) ?? null,
          $gallery_donor_text: (record.gallery_donor_text as string) ?? null,
          $updated_at: (record.updated_at as string) ?? null,
        });
        for (const tag of (record.artists_tags as string[]) ?? [])
          insertArtistsTag.run({ $artwork_id: artworkId, $tag: tag });
        for (const culture of (record.culture as string[]) ?? [])
          insertCulture.run({ $artwork_id: artworkId, $culture: culture });
        for (const mat of (record.support_materials as Record<
          string,
          unknown
        >[]) ?? [])
          insertSupportMaterial.run({
            $artwork_id: artworkId,
            $description: (mat.description as string) ?? null,
            $watermarks: loadJsonOrNull(mat.watermarks),
          });
        for (const ins of (record.inscriptions as Record<string, unknown>[]) ??
          [])
          insertInscription.run({
            $artwork_id: artworkId,
            $inscription: (ins.inscription as string) ?? null,
            $inscription_translation:
              (ins.inscription_translation as string) ?? null,
            $inscription_remark: (ins.inscription_remark as string) ?? null,
            $sortorder: (ins.sortorder as number) ?? null,
          });
        const exhibitions = record.exhibitions as Record<
          string,
          unknown[]
        > | null;
        if (exhibitions) {
          for (const ex of (exhibitions.current as Record<string, unknown>[]) ??
            [])
            insertExhibitionCurrent.run({
              $artwork_id: artworkId,
              $exhibition_id: (ex.id as number) ?? null,
              $title: (ex.title as string) ?? null,
              $description: (ex.description as string) ?? null,
              $opening_date: (ex.opening_date as string) ?? null,
            });
          for (const ex of (exhibitions.legacy as Record<string, unknown>[]) ??
            [])
            insertExhibitionLegacy.run({
              $artwork_id: artworkId,
              $description: (ex.description as string) ?? null,
              $opening_date: (ex.opening_date as string) ?? null,
            });
        }
        for (const prov of (record.provenance as Record<string, unknown>[]) ??
          [])
          insertProvenance.run({
            $artwork_id: artworkId,
            $description: (prov.description as string) ?? null,
            $citations: loadJsonOrNull(prov.citations),
            $footnotes: loadJsonOrNull(prov.footnotes),
            $date: (prov.date as string) ?? null,
            $sortorder: (prov.sortorder as number) ?? null,
          });
        for (const work of (record.related_works as Record<
          string,
          unknown
        >[]) ?? [])
          insertRelatedWork.run({
            $artwork_id: artworkId,
            $related_work_id: (work.id as number) ?? null,
            $description: (work.description as string) ?? null,
            $relationship: (work.relationship as string) ?? null,
          });
        for (const num of (record.former_accession_numbers as string[]) ?? [])
          insertFormerAccession.run({
            $artwork_id: artworkId,
            $accession_number: num,
          });
        for (const cit of (record.citations as Record<string, unknown>[]) ?? [])
          insertCitation.run({
            $artwork_id: artworkId,
            $citation: (cit.citation as string) ?? null,
            $page_number: (cit.page_number as string) ?? null,
            $url: (cit.url as string) ?? null,
          });
        for (const img of (record.alternate_images as Record<
          string,
          unknown
        >[]) ?? [])
          insertAlternateImage.run({
            $artwork_id: artworkId,
            $date_created: (img.date_created as string) ?? null,
            $annotation: (img.annotation as string) ?? null,
            $web: loadJsonOrNull(img.web),
            $print: loadJsonOrNull(img.print),
            $full_image: loadJsonOrNull(img.full),
          });
        for (const creator of (record.creators as Record<string, unknown>[]) ??
          [])
          insertCreator.run({
            $artwork_id: artworkId,
            $creator_id: (creator.id as number) ?? null,
            $description: (creator.description as string) ?? null,
            $extent: (creator.extent as string) ?? null,
            $qualifier: (creator.qualifier as string) ?? null,
            $role: (creator.role as string) ?? null,
            $biography: (creator.biography as string) ?? null,
            $name_in_original_language:
              (creator.name_in_original_language as string) ?? null,
            $birth_year: (creator.birth_year as string) ?? null,
            $death_year: (creator.death_year as string) ?? null,
          });
      }
    });
    insertAll();
    db.close();
    console.log(`Inserted ${data.length} artworks. Database: ${dbPath}`);
  }

  async search(options: SearchOptions): Promise<ArtworkResult[]> {
    const { limit, page, hasImageOnly } = this.withDefaults(options);
    const db = getDb();

    const params: (string | number)[] = [];
    let where = buildSearchWhere(options, params);

    // Filter to only records that have an image
    if (hasImageOnly) {
      const imageCondition = "a.images IS NOT NULL AND a.images != 'null'";
      where = where
        ? `${where} AND ${imageCondition}`
        : ` WHERE ${imageCondition}`;
    }

    const sql = `SELECT a.id, a.accession_number, a.title, a.description,
                        a.share_license_status, a.technique, a.type,
                        a.department, a.measurements, a.creditline, a.url,
                        a.images, a.creation_date, a.creation_date_earliest,
                        a.creation_date_latest
                 FROM artworks a${where}
                 ORDER BY a.id
                 LIMIT ? OFFSET ?`;
    params.push(limit, page * limit);

    const rows = db.query(sql).all(...params) as CmaArtworkRow[];
    if (rows.length === 0) return [];

    const objectIds = rows.map((r) => r.id);
    const placeholders = objectIds.map(() => "?").join(",");

    // Batch-fetch creators
    const creatorRows = db
      .query(
        `SELECT artwork_id, creator_id, description, role, biography,
                birth_year, death_year
         FROM creators
         WHERE artwork_id IN (${placeholders})
         ORDER BY artwork_id, id`,
      )
      .all(...objectIds) as CmaCreatorRow[];

    const creatorsByArtwork = new Map<number, Artist[]>();
    for (const c of creatorRows) {
      const list = creatorsByArtwork.get(c.artwork_id) ?? [];
      list.push({
        name: c.description ?? "Unknown",
        role: c.role ?? undefined,
        birthYear: c.birth_year ? Number.parseInt(c.birth_year, 10) : undefined,
        deathYear: c.death_year ? Number.parseInt(c.death_year, 10) : undefined,
      });
      creatorsByArtwork.set(c.artwork_id, list);
    }

    // Batch-fetch cultures
    const cultureRows = db
      .query(
        `SELECT artwork_id, culture FROM cultures
         WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as CmaCultureRow[];

    const culturesByArtwork = new Map<number, string[]>();
    for (const cu of cultureRows) {
      const list = culturesByArtwork.get(cu.artwork_id) ?? [];
      list.push(cu.culture);
      culturesByArtwork.set(cu.artwork_id, list);
    }

    // Batch-fetch alternate images
    const altImageRows = db
      .query(
        `SELECT artwork_id, web, print, full_image
         FROM alternate_images
         WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as CmaAlternateImageRow[];

    const altImagesByArtwork = new Map<number, string[]>();
    for (const img of altImageRows) {
      const list = altImagesByArtwork.get(img.artwork_id) ?? [];
      const webUrl = parseImageAsset(img.web)?.url;
      const printUrl = parseImageAsset(img.print)?.url;
      const fullUrl = parseImageAsset(img.full_image)?.url;
      if (webUrl) list.push(webUrl);
      if (printUrl) list.push(printUrl);
      if (fullUrl) list.push(fullUrl);
      altImagesByArtwork.set(img.artwork_id, list);
    }

    // Build results
    const results: ArtworkResult[] = [];
    for (const row of rows) {
      const imageUrl =
        parseImages(row.images)?.web?.url ??
        parseImages(row.images)?.full?.url ??
        parseImages(row.images)?.print?.url ??
        "";
      if (hasImageOnly && !imageUrl) continue;

      results.push(
        rowToArtworkResult(
          row,
          creatorsByArtwork.get(row.id) ?? [],
          culturesByArtwork.get(row.id) ?? [],
          normalizeStringArray(altImagesByArtwork.get(row.id) ?? []),
          this.id,
          this.createGlobalId.bind(this),
        ),
      );
    }

    return results;
  }

  async getById(localId: string): Promise<ArtworkResult | null> {
    const artworkId = Number.parseInt(localId, 10);
    if (Number.isNaN(artworkId)) return null;

    const db = getDb();

    const row = db
      .query(
        `SELECT id, accession_number, title, description,
                share_license_status, technique, type,
                department, measurements, creditline, url,
                images, creation_date, creation_date_earliest,
                creation_date_latest
         FROM artworks WHERE id = ?`,
      )
      .get(artworkId) as CmaArtworkRow | undefined;
    if (!row) return null;

    const images = parseImages(row.images);
    const imageUrl =
      images?.web?.url ?? images?.full?.url ?? images?.print?.url ?? "";
    if (!imageUrl) return null;

    // Creators
    const creatorRows = db
      .query(
        `SELECT artwork_id, creator_id, description, role, biography,
                birth_year, death_year
         FROM creators WHERE artwork_id = ? ORDER BY id`,
      )
      .all(artworkId) as CmaCreatorRow[];

    const artists: Artist[] = creatorRows.map((c) => ({
      name: c.description ?? "Unknown",
      role: c.role ?? undefined,
      birthYear: c.birth_year ? Number.parseInt(c.birth_year, 10) : undefined,
      deathYear: c.death_year ? Number.parseInt(c.death_year, 10) : undefined,
    }));

    // Cultures
    const cultureRows = db
      .query(`SELECT culture FROM cultures WHERE artwork_id = ?`)
      .all(artworkId) as Pick<CmaCultureRow, "culture">[];
    const cultures = cultureRows.map((cu) => cu.culture);

    // Alternate images
    const altImageRows = db
      .query(
        `SELECT web, print, full_image FROM alternate_images WHERE artwork_id = ?`,
      )
      .all(artworkId) as Omit<CmaAlternateImageRow, "artwork_id">[];

    const additionalImages: string[] = [];
    for (const img of altImageRows) {
      const webUrl = parseImageAsset(img.web)?.url;
      const printUrl = parseImageAsset(img.print)?.url;
      const fullUrl = parseImageAsset(img.full_image)?.url;
      if (webUrl) additionalImages.push(webUrl);
      if (printUrl) additionalImages.push(printUrl);
      if (fullUrl) additionalImages.push(fullUrl);
    }

    return rowToArtworkResult(
      row,
      artists,
      cultures,
      normalizeStringArray(additionalImages),
      this.id,
      this.createGlobalId.bind(this),
    );
  }
}

// ---------------------------------------------------------------------------
// Data loader: load CMA JSON into SQLite (processed/opendata.db)
// ---------------------------------------------------------------------------

const CMA_LOADER_SCHEMA = `
CREATE TABLE IF NOT EXISTS artworks (id INTEGER PRIMARY KEY, accession_number TEXT, share_license_status TEXT, tombstone TEXT, current_location TEXT, title TEXT, title_in_original_language TEXT, series TEXT, series_in_original_language TEXT, creation_date TEXT, creation_date_earliest INTEGER, creation_date_latest INTEGER, technique TEXT, department TEXT, collection TEXT, type TEXT, measurements TEXT, dimensions TEXT, state_of_the_work TEXT, edition_of_the_work TEXT, copyright TEXT, find_spot TEXT, did_you_know TEXT, description TEXT, external_resources TEXT, catalogue_raisonne TEXT, url TEXT, images TEXT, creditline TEXT, sketchfab_id TEXT, sketchfab_url TEXT, gallery_donor_text TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS artists_tags (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), tag TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cultures (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), culture TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS support_materials (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), description TEXT, watermarks TEXT);
CREATE TABLE IF NOT EXISTS inscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), inscription TEXT, inscription_translation TEXT, inscription_remark TEXT, sortorder INTEGER);
CREATE TABLE IF NOT EXISTS exhibitions_current (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), exhibition_id INTEGER, title TEXT, description TEXT, opening_date TEXT);
CREATE TABLE IF NOT EXISTS exhibitions_legacy (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), description TEXT, opening_date TEXT);
CREATE TABLE IF NOT EXISTS provenance (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), description TEXT, citations TEXT, footnotes TEXT, date TEXT, sortorder INTEGER);
CREATE TABLE IF NOT EXISTS related_works (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), related_work_id INTEGER, description TEXT, relationship TEXT);
CREATE TABLE IF NOT EXISTS former_accession_numbers (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), accession_number TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS citations (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), citation TEXT, page_number TEXT, url TEXT);
CREATE TABLE IF NOT EXISTS alternate_images (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), date_created TEXT, annotation TEXT, web TEXT, print TEXT, full_image TEXT);
CREATE TABLE IF NOT EXISTS creators (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), creator_id INTEGER, description TEXT, extent TEXT, qualifier TEXT, role TEXT, biography TEXT, name_in_original_language TEXT, birth_year TEXT, death_year TEXT);
CREATE INDEX IF NOT EXISTS idx_artworks_title ON artworks(title);
CREATE INDEX IF NOT EXISTS idx_creators_artwork_id ON creators(artwork_id);
CREATE INDEX IF NOT EXISTS idx_cultures_artwork_id ON cultures(artwork_id);
`;

function loadJsonOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

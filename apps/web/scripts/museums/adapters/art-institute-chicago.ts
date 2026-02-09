import { Database } from "bun:sqlite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readdirSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import type { ArtworkResult, SearchOptions } from "@/lib/museums/types";
import { Museum } from "../museum";
import { normalizeStringArray } from "../utils/normalize";
import { parseMediums } from "../utils/parse-medium";

const __dirname = dirname(fileURLToPath(import.meta.url));

const IIIF_URL = "https://www.artic.edu/iiif/2";

/** Main display size (larger direct link); AIC recommends 843 or 1686. */
const MAIN_IMAGE_SIZE = 1686;
const THUMB_SIZE = 200;

const DATA_MUSEUM_DIR = join(__dirname, "../../../data/museums/artic");
const PROCESSED_DIR = join(DATA_MUSEUM_DIR, "processed");
const DEFAULT_DB_PATH = join(PROCESSED_DIR, "opendata.db");
const DEFAULT_SOURCE_PATH = join(DATA_MUSEUM_DIR, "raw", "json", "artworks");

function getDbPath(): string {
  return process.env.ARTIC_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
}

let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    const path = getDbPath();
    dbInstance = new Database(path, { readonly: true });
  }
  return dbInstance;
}

/** Builds a direct IIIF image URL (usable in <img src>). */
function buildImageUrl(imageId: string, size: number) {
  return `${IIIF_URL}/${imageId}/full/${size},/0/default.jpg`;
}

// ---------------------------------------------------------------------------
// Row interfaces
// ---------------------------------------------------------------------------

interface ArticArtworkRow {
  id: number;
  title: string | null;
  artist_display: string | null;
  artist_title: string | null;
  image_id: string | null;
  medium_display: string | null;
  artwork_type_title: string | null;
  classification_title: string | null;
  style_title: string | null;
  date_display: string | null;
  date_start: number | null;
  date_end: number | null;
  dimensions: string | null;
  department_title: string | null;
  place_of_origin: string | null;
  is_public_domain: number;
  description: string | null;
  credit_line: string | null;
  provenance_text: string | null;
}

interface TitleRow {
  artwork_id: number;
  title: string;
}

interface AltImageRow {
  artwork_id: number;
  image_id: string;
}

// ---------------------------------------------------------------------------
// Object-type genres (same set as the old API adapter)
// ---------------------------------------------------------------------------

const AIC_OBJECT_TYPE_GENRES = new Set([
  "painting",
  "paintings",
  "sculpture",
  "print",
  "prints",
  "drawing",
  "drawings",
  "photograph",
  "photographs",
  "textile",
  "textiles",
  "ceramic",
  "ceramics",
  "furniture",
  "decorative arts",
]);

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

const ARTWORK_COLUMNS = `a.id, a.title, a.artist_display, a.artist_title,
  a.image_id, a.medium_display, a.artwork_type_title, a.classification_title,
  a.style_title, a.date_display, a.date_start, a.date_end, a.dimensions,
  a.department_title, a.place_of_origin, a.is_public_domain, a.description,
  a.credit_line, a.provenance_text`;

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
      const wordConditions = words.map(() => "a.artist_title LIKE ?");
      conditions.push(`(${wordConditions.join(" AND ")})`);
      for (const word of words) {
        params.push(`%${word}%`);
      }
    }
  }

  if (options.genres?.length) {
    const objectTypeGenres = options.genres.filter((g) =>
      AIC_OBJECT_TYPE_GENRES.has(g.toLowerCase()),
    );
    const styleGenres = options.genres.filter(
      (g) => !AIC_OBJECT_TYPE_GENRES.has(g.toLowerCase()),
    );

    const genreConditions: string[] = [];

    if (objectTypeGenres.length > 0) {
      // Match against classification_titles child table
      const placeholders = objectTypeGenres.map(() => "LOWER(ct.title) LIKE ?");
      genreConditions.push(
        `a.id IN (SELECT ct.artwork_id FROM classification_titles ct WHERE ${placeholders.join(" OR ")})`,
      );
      for (const g of objectTypeGenres) {
        params.push(`%${g.toLowerCase()}%`);
      }
    }

    if (styleGenres.length > 0) {
      // Match against style_titles child table
      const placeholders = styleGenres.map(() => "LOWER(st.title) LIKE ?");
      genreConditions.push(
        `a.id IN (SELECT st.artwork_id FROM style_titles st WHERE ${placeholders.join(" OR ")})`,
      );
      for (const g of styleGenres) {
        params.push(`%${g.toLowerCase()}%`);
      }
    }

    if (genreConditions.length > 0) {
      conditions.push(`(${genreConditions.join(" OR ")})`);
    }
  }

  if (options.mediums?.length) {
    conditions.push("a.medium_display LIKE ?");
    params.push(`%${options.mediums[0]}%`);
  }

  if (options.classifications?.length) {
    const placeholders = options.classifications.map(
      () => "LOWER(ct.title) LIKE ?",
    );
    conditions.push(
      `a.id IN (SELECT ct.artwork_id FROM classification_titles ct WHERE ${placeholders.join(" OR ")})`,
    );
    for (const c of options.classifications) {
      params.push(`%${c.toLowerCase()}%`);
    }
  }

  if (options.publicDomainOnly) {
    conditions.push("a.is_public_domain = 1");
  }

  if (options.dateRange) {
    conditions.push(
      "a.date_start >= ? AND (a.date_end <= ? OR a.date_end IS NULL)",
    );
    params.push(options.dateRange.start, options.dateRange.end);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

// ---------------------------------------------------------------------------
// Row → ArtworkResult
// ---------------------------------------------------------------------------

function rowToArtworkResult(
  row: ArticArtworkRow,
  classificationTitles: string[],
  styleTitles: string[],
  subjectTitles: string[],
  termTitles: string[],
  altImageIds: string[],
  museumId: string,
  createGlobalId: (localId: string) => string,
): ArtworkResult {
  const imageId = row.image_id ?? "";
  const imageUrl = imageId ? buildImageUrl(imageId, MAIN_IMAGE_SIZE) : "";
  const thumbnailUrl = imageId ? buildImageUrl(imageId, THUMB_SIZE) : undefined;
  const additionalImages = normalizeStringArray(
    altImageIds.map((altId) => buildImageUrl(altId, MAIN_IMAGE_SIZE)),
  );
  const { mediums, mediumDisplay } = parseMediums(
    row.medium_display ?? undefined,
  );
  const classifications = normalizeStringArray([
    ...classificationTitles,
    row.artwork_type_title,
  ]);
  const tags = normalizeStringArray([...subjectTitles, ...termTitles]);
  const genres = normalizeStringArray(styleTitles);

  return {
    globalId: createGlobalId(String(row.id)),
    localId: String(row.id),
    museumId,
    title: row.title?.trim() || "Untitled",
    description: row.description ?? undefined,
    artists: row.artist_title
      ? [{ name: row.artist_title, role: "Artist" }]
      : [],
    imageUrl,
    thumbnailUrl,
    additionalImages,
    mediums,
    mediumDisplay,
    genres,
    classifications,
    tags,
    dateCreated: row.date_display ?? undefined,
    dateStart: row.date_start ?? undefined,
    dateEnd: row.date_end ?? undefined,
    dimensions: row.dimensions ?? undefined,
    department: row.department_title ?? undefined,
    culture: row.place_of_origin ?? undefined,
    creditLine: row.credit_line ?? undefined,
    provenance: row.provenance_text ?? undefined,
    isPublicDomain: row.is_public_domain === 1,
    sourceUrl: `https://www.artic.edu/artworks/${row.id}`,
    rawMetadata: {
      id: row.id,
      artist_display: row.artist_display,
      classification_title: row.classification_title,
      style_title: row.style_title,
    },
  };
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ArtInstituteChicagoMuseum extends Museum {
  readonly id = "artic";
  readonly name = "Art Institute of Chicago";

  getDataSource(_options: SearchOptions): string {
    return this.getProcessedDbPath();
  }

  getDefaultSourcePath(): string {
    return DEFAULT_SOURCE_PATH;
  }

  getProcessedDbPath(): string {
    return process.env.ARTIC_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
  }

  async loadDataIntoSqlite(sourcePath: string): Promise<void> {
    const artworksDir = sourcePath;
    const files = readdirSync(artworksDir).filter((f) => f.endsWith(".json"));
    if (files.length === 0) {
      throw new Error(`No JSON files in ${artworksDir}`);
    }

    const dbPath = this.getProcessedDbPath();
    try {
      if (existsSync(dbPath)) unlinkSync(dbPath);
    } catch {}
    mkdirSync(PROCESSED_DIR, { recursive: true });

    const db = new Database(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = OFF");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(ARTIC_LOADER_SCHEMA);

    const insertArtwork = db.prepare(`
    INSERT OR IGNORE INTO artworks (id, title, alt_titles, main_reference_number, date_start, date_end, date_display, date_qualifier_title, artist_display, artist_title, artist_id, place_of_origin, description, short_description, dimensions, dimensions_detail, medium_display, inscriptions, credit_line, provenance_text, publication_history, exhibition_history, is_public_domain, is_boosted, is_zoomable, image_id, artwork_type_title, artwork_type_id, department_title, department_id, classification_title, style_title, thumbnail, colorfulness, gallery_title, gallery_id, source_updated_at, updated_at)
    VALUES ($id, $title, $alt_titles, $main_reference_number, $date_start, $date_end, $date_display, $date_qualifier_title, $artist_display, $artist_title, $artist_id, $place_of_origin, $description, $short_description, $dimensions, $dimensions_detail, $medium_display, $inscriptions, $credit_line, $provenance_text, $publication_history, $exhibition_history, $is_public_domain, $is_boosted, $is_zoomable, $image_id, $artwork_type_title, $artwork_type_id, $department_title, $department_id, $classification_title, $style_title, $thumbnail, $colorfulness, $gallery_title, $gallery_id, $source_updated_at, $updated_at)
  `);
    const insertArtistId = db.prepare(
      "INSERT INTO artist_ids (artwork_id, artist_id, artist_title) VALUES ($artwork_id, $artist_id, $artist_title)",
    );
    const insertClassification = db.prepare(
      "INSERT INTO classification_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertStyle = db.prepare(
      "INSERT INTO style_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertSubject = db.prepare(
      "INSERT INTO subject_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertTerm = db.prepare(
      "INSERT INTO term_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertMaterial = db.prepare(
      "INSERT INTO material_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertTechnique = db.prepare(
      "INSERT INTO technique_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertTheme = db.prepare(
      "INSERT INTO theme_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertCategory = db.prepare(
      "INSERT INTO category_titles (artwork_id, title) VALUES ($artwork_id, $title)",
    );
    const insertAltImage = db.prepare(
      "INSERT INTO alt_image_ids (artwork_id, image_id) VALUES ($artwork_id, $image_id)",
    );

    const BATCH_SIZE = 5000;
    let inserted = 0;
    let skipped = 0;
    const start = performance.now();

    const insertBatch = db.transaction((records: Record<string, unknown>[]) => {
      for (const r of records) {
        const artworkId = r.id as number;
        insertArtwork.run({
          $id: artworkId,
          $title: (r.title as string) ?? null,
          $alt_titles: jsonOrNull(r.alt_titles),
          $main_reference_number: (r.main_reference_number as string) ?? null,
          $date_start: (r.date_start as number) ?? null,
          $date_end: (r.date_end as number) ?? null,
          $date_display: (r.date_display as string) ?? null,
          $date_qualifier_title: (r.date_qualifier_title as string) ?? null,
          $artist_display: (r.artist_display as string) ?? null,
          $artist_title: (r.artist_title as string) ?? null,
          $artist_id: (r.artist_id as number) ?? null,
          $place_of_origin: (r.place_of_origin as string) ?? null,
          $description: (r.description as string) ?? null,
          $short_description: (r.short_description as string) ?? null,
          $dimensions: (r.dimensions as string) ?? null,
          $dimensions_detail: jsonOrNull(r.dimensions_detail),
          $medium_display: (r.medium_display as string) ?? null,
          $inscriptions: (r.inscriptions as string) ?? null,
          $credit_line: (r.credit_line as string) ?? null,
          $provenance_text: (r.provenance_text as string) ?? null,
          $publication_history: (r.publication_history as string) ?? null,
          $exhibition_history: (r.exhibition_history as string) ?? null,
          $is_public_domain: boolToInt(r.is_public_domain),
          $is_boosted: boolToInt(r.is_boosted),
          $is_zoomable: boolToInt(r.is_zoomable),
          $image_id: (r.image_id as string) ?? null,
          $artwork_type_title: (r.artwork_type_title as string) ?? null,
          $artwork_type_id: (r.artwork_type_id as number) ?? null,
          $department_title: (r.department_title as string) ?? null,
          $department_id: (r.department_id as string) ?? null,
          $classification_title: (r.classification_title as string) ?? null,
          $style_title: (r.style_title as string) ?? null,
          $thumbnail: jsonOrNull(r.thumbnail),
          $colorfulness: (r.colorfulness as number) ?? null,
          $gallery_title: (r.gallery_title as string) ?? null,
          $gallery_id: (r.gallery_id as number) ?? null,
          $source_updated_at: (r.source_updated_at as string) ?? null,
          $updated_at: (r.updated_at as string) ?? null,
        });
        for (let i = 0; i < ((r.artist_ids as number[]) ?? []).length; i++) {
          const ids = r.artist_ids as number[];
          const titles = (r.artist_titles as string[]) ?? [];
          insertArtistId.run({
            $artwork_id: artworkId,
            $artist_id: ids[i],
            $artist_title: titles[i] ?? null,
          });
        }
        for (const t of (r.classification_titles as string[]) ?? [])
          insertClassification.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.style_titles as string[]) ?? [])
          insertStyle.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.subject_titles as string[]) ?? [])
          insertSubject.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.term_titles as string[]) ?? [])
          insertTerm.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.material_titles as string[]) ?? [])
          insertMaterial.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.technique_titles as string[]) ?? [])
          insertTechnique.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.theme_titles as string[]) ?? [])
          insertTheme.run({ $artwork_id: artworkId, $title: t });
        for (const t of (r.category_titles as string[]) ?? [])
          insertCategory.run({ $artwork_id: artworkId, $title: t });
        for (const imgId of (r.alt_image_ids as string[]) ?? [])
          insertAltImage.run({ $artwork_id: artworkId, $image_id: imgId });
      }
    });

    let batch: Record<string, unknown>[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const content = await Bun.file(join(artworksDir, files[i])).json();
        batch.push(content as Record<string, unknown>);
      } catch {
        skipped++;
        continue;
      }
      if (batch.length >= BATCH_SIZE) {
        insertBatch(batch);
        inserted += batch.length;
        batch = [];
      }
    }
    if (batch.length > 0) {
      insertBatch(batch);
      inserted += batch.length;
    }

    db.close();
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(
      `Inserted ${inserted} artworks in ${elapsed}s${skipped > 0 ? `; skipped ${skipped} files` : ""}. Database: ${dbPath}`,
    );
  }

  async search(options: SearchOptions): Promise<ArtworkResult[]> {
    const { limit, page, hasImageOnly } = this.withDefaults(options);
    const db = getDb();

    const params: (string | number)[] = [];
    let where = buildSearchWhere(options, params);

    if (hasImageOnly) {
      const imageCondition = "a.image_id IS NOT NULL AND a.image_id != ''";
      where = where
        ? `${where} AND ${imageCondition}`
        : ` WHERE ${imageCondition}`;
    }

    const sql = `SELECT ${ARTWORK_COLUMNS}
                 FROM artworks a${where}
                 ORDER BY a.id
                 LIMIT ? OFFSET ?`;
    params.push(limit, page * limit);

    const rows = db.query(sql).all(...params) as ArticArtworkRow[];
    if (rows.length === 0) return [];

    const objectIds = rows.map((r) => r.id);
    const placeholders = objectIds.map(() => "?").join(",");

    // Batch-fetch child table data
    const classRows = db
      .query(
        `SELECT artwork_id, title FROM classification_titles WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as TitleRow[];

    const styleRows = db
      .query(
        `SELECT artwork_id, title FROM style_titles WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as TitleRow[];

    const subjectRows = db
      .query(
        `SELECT artwork_id, title FROM subject_titles WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as TitleRow[];

    const termRows = db
      .query(
        `SELECT artwork_id, title FROM term_titles WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as TitleRow[];

    const altImageRows = db
      .query(
        `SELECT artwork_id, image_id FROM alt_image_ids WHERE artwork_id IN (${placeholders})`,
      )
      .all(...objectIds) as AltImageRow[];

    // Group by artwork_id
    const classMap = groupByArtwork(classRows);
    const styleMap = groupByArtwork(styleRows);
    const subjectMap = groupByArtwork(subjectRows);
    const termMap = groupByArtwork(termRows);
    const altImageMap = new Map<number, string[]>();
    for (const r of altImageRows) {
      const list = altImageMap.get(r.artwork_id) ?? [];
      list.push(r.image_id);
      altImageMap.set(r.artwork_id, list);
    }

    return rows.map((row) =>
      rowToArtworkResult(
        row,
        classMap.get(row.id) ?? [],
        styleMap.get(row.id) ?? [],
        subjectMap.get(row.id) ?? [],
        termMap.get(row.id) ?? [],
        altImageMap.get(row.id) ?? [],
        this.id,
        this.createGlobalId.bind(this),
      ),
    );
  }

  async getById(localId: string): Promise<ArtworkResult | null> {
    const artworkId = Number.parseInt(localId, 10);
    if (Number.isNaN(artworkId)) return null;

    const db = getDb();

    const row = db
      .query(`SELECT ${ARTWORK_COLUMNS} FROM artworks a WHERE a.id = ?`)
      .get(artworkId) as ArticArtworkRow | undefined;
    if (!row) return null;
    if (!row.image_id) return null;

    const classRows = db
      .query(
        "SELECT artwork_id, title FROM classification_titles WHERE artwork_id = ?",
      )
      .all(artworkId) as TitleRow[];
    const styleRows = db
      .query("SELECT artwork_id, title FROM style_titles WHERE artwork_id = ?")
      .all(artworkId) as TitleRow[];
    const subjectRows = db
      .query(
        "SELECT artwork_id, title FROM subject_titles WHERE artwork_id = ?",
      )
      .all(artworkId) as TitleRow[];
    const termRows = db
      .query("SELECT artwork_id, title FROM term_titles WHERE artwork_id = ?")
      .all(artworkId) as TitleRow[];
    const altImageRows = db
      .query(
        "SELECT artwork_id, image_id FROM alt_image_ids WHERE artwork_id = ?",
      )
      .all(artworkId) as AltImageRow[];

    return rowToArtworkResult(
      row,
      classRows.map((r) => r.title),
      styleRows.map((r) => r.title),
      subjectRows.map((r) => r.title),
      termRows.map((r) => r.title),
      altImageRows.map((r) => r.image_id),
      this.id,
      this.createGlobalId.bind(this),
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByArtwork(rows: TitleRow[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const r of rows) {
    const list = map.get(r.artwork_id) ?? [];
    list.push(r.title);
    map.set(r.artwork_id, list);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Data loader: load raw AIC JSON dump into SQLite (processed/opendata.db)
// ---------------------------------------------------------------------------

const ARTIC_LOADER_SCHEMA = `
CREATE TABLE IF NOT EXISTS artworks (
  id                    INTEGER PRIMARY KEY,
  title                 TEXT,
  alt_titles            TEXT,
  main_reference_number TEXT,
  date_start            INTEGER,
  date_end              INTEGER,
  date_display          TEXT,
  date_qualifier_title  TEXT,
  artist_display        TEXT,
  artist_title          TEXT,
  artist_id             INTEGER,
  place_of_origin       TEXT,
  description           TEXT,
  short_description     TEXT,
  dimensions            TEXT,
  dimensions_detail     TEXT,
  medium_display        TEXT,
  inscriptions          TEXT,
  credit_line           TEXT,
  provenance_text       TEXT,
  publication_history   TEXT,
  exhibition_history    TEXT,
  is_public_domain      INTEGER,
  is_boosted            INTEGER,
  is_zoomable           INTEGER,
  image_id              TEXT,
  artwork_type_title    TEXT,
  artwork_type_id       INTEGER,
  department_title      TEXT,
  department_id         TEXT,
  classification_title   TEXT,
  style_title           TEXT,
  thumbnail             TEXT,
  colorfulness          REAL,
  gallery_title         TEXT,
  gallery_id            INTEGER,
  source_updated_at     TEXT,
  updated_at            TEXT
);
CREATE TABLE IF NOT EXISTS artist_ids (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), artist_id INTEGER NOT NULL, artist_title TEXT);
CREATE TABLE IF NOT EXISTS classification_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS style_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS subject_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS term_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS material_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS technique_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS theme_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS category_titles (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS alt_image_ids (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id), image_id TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_artworks_title ON artworks(title);
CREATE INDEX IF NOT EXISTS idx_artworks_artist_title ON artworks(artist_title);
CREATE INDEX IF NOT EXISTS idx_artworks_image_id ON artworks(image_id);
CREATE INDEX IF NOT EXISTS idx_artworks_is_public_domain ON artworks(is_public_domain);
CREATE INDEX IF NOT EXISTS idx_classification_titles_artwork_id ON classification_titles(artwork_id);
CREATE INDEX IF NOT EXISTS idx_style_titles_artwork_id ON style_titles(artwork_id);
CREATE INDEX IF NOT EXISTS idx_subject_titles_artwork_id ON subject_titles(artwork_id);
CREATE INDEX IF NOT EXISTS idx_term_titles_artwork_id ON term_titles(artwork_id);
CREATE INDEX IF NOT EXISTS idx_alt_image_ids_artwork_id ON alt_image_ids(artwork_id);
`;

function jsonOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

function boolToInt(value: unknown): number {
  return value ? 1 : 0;
}

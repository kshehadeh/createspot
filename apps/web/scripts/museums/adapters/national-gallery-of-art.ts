import { Database } from "bun:sqlite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import type { ArtworkResult, Artist, SearchOptions } from "@/lib/museums/types";
import { Museum } from "../museum";
import { normalizeStringArray } from "../utils/normalize";
import { parseMediums } from "../utils/parse-medium";

const __dirname = dirname(fileURLToPath(import.meta.url));

const NGA_SOURCE_URL_BASE = "https://www.nga.gov/collection/art-object-page.";
const NGA_SOURCE_URL_SUFFIX = ".html";

const DATA_MUSEUM_DIR = join(__dirname, "../../../data/museums/nga");
const PROCESSED_DIR = join(DATA_MUSEUM_DIR, "processed");
const DEFAULT_DB_PATH = join(PROCESSED_DIR, "opendata.db");
const DEFAULT_DATA_ROOT = join(DATA_MUSEUM_DIR, "raw", "data");

function getDbPath(): string {
  return process.env.NGA_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
}

let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    const path = getDbPath();
    dbInstance = new Database(path, { readonly: true });
  }
  return dbInstance;
}

interface NgaObjectRow {
  objectid: number;
  title: string | null;
  displaydate: string | null;
  beginyear: number | null;
  endyear: number | null;
  medium: string | null;
  dimensions: string | null;
  creditline: string | null;
  provenancetext: string | null;
  classification: string | null;
  subclassification: string | null;
  departmentabbr: string | null;
  uuid: string;
  iiifurl: string;
  iiifthumburl: string | null;
}

interface NgaConstituentRow {
  preferreddisplayname: string | null;
  roletype: string | null;
  role: string | null;
  nationality: string | null;
  beginyear: number | null;
  endyear: number | null;
}

interface NgaTermRow {
  termtype: string | null;
  term: string | null;
}

/** One row per object with one primary image (lowest sequence). */
const SEARCH_BASE = `
  SELECT o.objectid, o.title, o.displaydate, o.beginyear, o.endyear, o.medium,
         o.dimensions, o.creditline, o.provenancetext, o.classification,
         o.subclassification, o.departmentabbr,
         p.uuid, p.iiifurl, p.iiifthumburl
  FROM objects o
  INNER JOIN (
    SELECT depictstmsobjectid, uuid, iiifurl, iiifthumburl
    FROM (
      SELECT depictstmsobjectid, uuid, iiifurl, iiifthumburl,
             ROW_NUMBER() OVER (PARTITION BY depictstmsobjectid ORDER BY sequence) AS rn
      FROM published_images
    ) WHERE rn = 1
  ) p ON p.depictstmsobjectid = o.objectid
`;

function buildSearchWhere(
  options: SearchOptions,
  params: (string | number)[],
): string {
  const conditions: string[] = [];

  const query = (options.query ?? "").trim();
  if (query) {
    conditions.push("(o.title LIKE ? OR o.attribution LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like);
  }

  if (options.artists?.length) {
    const artist = options.artists[0];
    // NGA uses "Last, First" format (e.g., "Gogh, Vincent van").
    // To match user inputs like "van gogh" or "vincent van gogh", we:
    // 1. Split the input into words
    // 2. Build a LIKE clause that requires ALL words to appear in the name (any order)
    const words = artist
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length > 0) {
      const wordConditions = words.map(() => "c.preferreddisplayname LIKE ?");
      conditions.push(
        `o.objectid IN (
          SELECT oc.objectid FROM objects_constituents oc
          JOIN constituents c ON c.constituentid = oc.constituentid
          WHERE oc.roletype = 'artist' AND ${wordConditions.join(" AND ")}
        )`,
      );
      for (const word of words) {
        params.push(`%${word}%`);
      }
    }
  }

  if (options.genres?.length || options.classifications?.length) {
    const val = options.genres?.[0] ?? options.classifications?.[0];
    if (val) {
      conditions.push(
        "(o.classification LIKE ? OR o.subclassification LIKE ?)",
      );
      const like = `%${val}%`;
      params.push(like, like);
    }
  }

  if (options.dateRange) {
    conditions.push(
      "o.beginyear <= ? AND (o.endyear >= ? OR o.endyear IS NULL)",
    );
    params.push(options.dateRange.end, options.dateRange.start);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

function rowToArtworkResult(
  row: NgaObjectRow,
  artists: Artist[],
  tags: string[],
  classifications: string[],
  museumId: string,
  createGlobalId: (localId: string) => string,
): ArtworkResult {
  const { mediums, mediumDisplay } = parseMediums(row.medium ?? undefined);
  const imageUrl = row.iiifurl.endsWith("/")
    ? `${row.iiifurl}full/full/0/default.jpg`
    : `${row.iiifurl}/full/full/0/default.jpg`;

  return {
    globalId: createGlobalId(String(row.objectid)),
    localId: String(row.objectid),
    museumId,
    title: row.title?.trim() || "Untitled",
    description: undefined,
    artists,
    imageUrl,
    thumbnailUrl: row.iiifthumburl ?? undefined,
    additionalImages: [],
    mediums,
    mediumDisplay: mediumDisplay ?? undefined,
    genres: classifications,
    classifications: normalizeStringArray([
      row.classification ?? "",
      row.subclassification ?? "",
      ...classifications,
    ]),
    tags,
    dateCreated: row.displaydate ?? undefined,
    dateStart: row.beginyear ?? undefined,
    dateEnd: row.endyear ?? undefined,
    dimensions: row.dimensions ?? undefined,
    department: row.departmentabbr ?? undefined,
    culture: undefined,
    creditLine: row.creditline ?? undefined,
    provenance: row.provenancetext ?? undefined,
    isPublicDomain: true,
    sourceUrl: `${NGA_SOURCE_URL_BASE}${row.objectid}${NGA_SOURCE_URL_SUFFIX}`,
    rawMetadata: {
      objectid: row.objectid,
      uuid: row.uuid,
      classification: row.classification,
      subclassification: row.subclassification,
    },
  };
}

export class NationalGalleryOfArtMuseum extends Museum {
  readonly id = "nga";
  readonly name = "National Gallery of Art";

  getDataSource(_options: SearchOptions): string {
    return this.getProcessedDbPath();
  }

  getDefaultSourcePath(): string {
    return DEFAULT_DATA_ROOT;
  }

  getProcessedDbPath(): string {
    return process.env.NGA_OPENDATA_DB_PATH ?? DEFAULT_DB_PATH;
  }

  async loadDataIntoSqlite(sourcePath: string): Promise<void> {
    const dataDir = sourcePath;
    const objectsPath = join(dataDir, "objects.csv");
    const publishedPath = join(dataDir, "published_images.csv");
    const ocPath = join(dataDir, "objects_constituents.csv");
    const constituentsPath = join(dataDir, "constituents.csv");
    const termsPath = join(dataDir, "objects_terms.csv");

    if (
      !existsSync(objectsPath) ||
      !existsSync(publishedPath) ||
      !existsSync(ocPath) ||
      !existsSync(constituentsPath) ||
      !existsSync(termsPath)
    ) {
      throw new Error(
        `Missing CSV files in ${dataDir}. Required: objects.csv, published_images.csv, objects_constituents.csv, constituents.csv, objects_terms.csv`,
      );
    }

    const dbPath = this.getProcessedDbPath();
    try {
      if (existsSync(dbPath)) unlinkSync(dbPath);
    } catch {}
    mkdirSync(PROCESSED_DIR, { recursive: true });

    const db = new Database(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = OFF");
    db.exec(NGA_LOADER_SCHEMA);

    const insertObject = db.prepare(
      "INSERT INTO objects (objectid, accessioned, title, displaydate, beginyear, endyear, medium, dimensions, creditline, provenancetext, classification, subclassification, departmentabbr, attribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertImage = db.prepare(
      "INSERT INTO published_images (uuid, iiifurl, iiifthumburl, viewtype, sequence, depictstmsobjectid) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertOC = db.prepare(
      "INSERT OR IGNORE INTO objects_constituents (objectid, constituentid, displayorder, roletype, role) VALUES (?, ?, ?, ?, ?)",
    );
    const insertConstituent = db.prepare(
      "INSERT INTO constituents (constituentid, preferreddisplayname, nationality, beginyear, endyear) VALUES (?, ?, ?, ?, ?)",
    );
    const insertTerm = db.prepare(
      "INSERT INTO objects_terms (termid, objectid, termtype, term) VALUES (?, ?, ?, ?)",
    );

    const toInt = (s: string) => (s === "" ? null : Number.parseInt(s, 10));
    const objectIds = new Set<number>();
    let termId = 0;

    let batch: { header: string[]; row: string[] }[] = [];
    for await (const chunk of loadReadCsv(objectsPath)) {
      const r = loadRowMap(chunk.header, chunk.row);
      if (toInt(r.accessioned ?? "") !== 1) continue;
      const objectid = toInt(r.objectid ?? "");
      if (objectid == null) continue;
      batch.push(chunk);
      if (batch.length >= NGA_LOADER_BATCH_SIZE) {
        db.transaction(() => {
          for (const { header: h, row } of batch) {
            const rr = loadRowMap(h, row);
            const oid = toInt(rr.objectid ?? "")!;
            objectIds.add(oid);
            insertObject.run(
              oid,
              toInt(rr.accessioned ?? ""),
              rr.title ?? null,
              rr.displaydate ?? null,
              toInt(rr.beginyear ?? ""),
              toInt(rr.endyear ?? ""),
              rr.medium ?? null,
              rr.dimensions ?? null,
              rr.creditline ?? null,
              rr.provenancetext ?? null,
              rr.classification ?? null,
              rr.subclassification ?? null,
              rr.departmentabbr ?? null,
              rr.attribution ?? null,
            );
          }
        })();
        batch = [];
      }
    }
    if (batch.length > 0) {
      db.transaction(() => {
        for (const { header: h, row } of batch) {
          const rr = loadRowMap(h, row);
          const oid = toInt(rr.objectid ?? "")!;
          objectIds.add(oid);
          insertObject.run(
            oid,
            toInt(rr.accessioned ?? ""),
            rr.title ?? null,
            rr.displaydate ?? null,
            toInt(rr.beginyear ?? ""),
            toInt(rr.endyear ?? ""),
            rr.medium ?? null,
            rr.dimensions ?? null,
            rr.creditline ?? null,
            rr.provenancetext ?? null,
            rr.classification ?? null,
            rr.subclassification ?? null,
            rr.departmentabbr ?? null,
            rr.attribution ?? null,
          );
        }
      })();
    }

    let imgBatch: { header: string[]; row: string[] }[] = [];
    for await (const chunk of loadReadCsv(publishedPath)) {
      const r = loadRowMap(chunk.header, chunk.row);
      const depict = toInt(r.depictstmsobjectid ?? "");
      if (depict == null || !objectIds.has(depict)) continue;
      imgBatch.push(chunk);
      if (imgBatch.length >= NGA_LOADER_BATCH_SIZE) {
        db.transaction(() => {
          for (const { header: h, row } of imgBatch) {
            const rr = loadRowMap(h, row);
            insertImage.run(
              rr.uuid ?? null,
              rr.iiifurl ?? null,
              rr.iiifthumburl ?? null,
              rr.viewtype ?? null,
              toInt(rr.sequence ?? "0") ?? 0,
              toInt(rr.depictstmsobjectid ?? "")!,
            );
          }
        })();
        imgBatch = [];
      }
    }
    if (imgBatch.length > 0) {
      db.transaction(() => {
        for (const { header: h, row } of imgBatch) {
          const rr = loadRowMap(h, row);
          insertImage.run(
            rr.uuid ?? null,
            rr.iiifurl ?? null,
            rr.iiifthumburl ?? null,
            rr.viewtype ?? null,
            toInt(rr.sequence ?? "0") ?? 0,
            toInt(rr.depictstmsobjectid ?? "")!,
          );
        }
      })();
    }

    const constituentIds = new Set<number>();
    let ocBatch: { header: string[]; row: string[] }[] = [];
    for await (const chunk of loadReadCsv(ocPath)) {
      const r = loadRowMap(chunk.header, chunk.row);
      const objectid = toInt(r.objectid ?? "");
      if (objectid == null || !objectIds.has(objectid)) continue;
      const constituentid = toInt(r.constituentid ?? "");
      if (constituentid == null) continue;
      constituentIds.add(constituentid);
      ocBatch.push(chunk);
      if (ocBatch.length >= NGA_LOADER_BATCH_SIZE) {
        db.transaction(() => {
          for (const { header: h, row } of ocBatch) {
            const rr = loadRowMap(h, row);
            insertOC.run(
              toInt(rr.objectid ?? "")!,
              toInt(rr.constituentid ?? "")!,
              toInt(rr.displayorder ?? "0") ?? 0,
              rr.roletype ?? null,
              rr.role ?? null,
            );
          }
        })();
        ocBatch = [];
      }
    }
    if (ocBatch.length > 0) {
      db.transaction(() => {
        for (const { header: h, row } of ocBatch) {
          const rr = loadRowMap(h, row);
          insertOC.run(
            toInt(rr.objectid ?? "")!,
            toInt(rr.constituentid ?? "")!,
            toInt(rr.displayorder ?? "0") ?? 0,
            rr.roletype ?? null,
            rr.role ?? null,
          );
        }
      })();
    }

    let constBatch: { header: string[]; row: string[] }[] = [];
    for await (const chunk of loadReadCsv(constituentsPath)) {
      const r = loadRowMap(chunk.header, chunk.row);
      const id = toInt(r.constituentid ?? "");
      if (id == null || !constituentIds.has(id)) continue;
      constBatch.push(chunk);
      if (constBatch.length >= NGA_LOADER_BATCH_SIZE) {
        db.transaction(() => {
          for (const { header: h, row } of constBatch) {
            const rr = loadRowMap(h, row);
            insertConstituent.run(
              toInt(rr.constituentid ?? "")!,
              rr.preferreddisplayname ?? null,
              rr.nationality ?? null,
              toInt(rr.beginyear ?? ""),
              toInt(rr.endyear ?? ""),
            );
          }
        })();
        constBatch = [];
      }
    }
    if (constBatch.length > 0) {
      db.transaction(() => {
        for (const { header: h, row } of constBatch) {
          const rr = loadRowMap(h, row);
          insertConstituent.run(
            toInt(rr.constituentid ?? "")!,
            rr.preferreddisplayname ?? null,
            rr.nationality ?? null,
            toInt(rr.beginyear ?? ""),
            toInt(rr.endyear ?? ""),
          );
        }
      })();
    }

    let termBatch: { header: string[]; row: string[] }[] = [];
    for await (const chunk of loadReadCsv(termsPath)) {
      const r = loadRowMap(chunk.header, chunk.row);
      const objectid = toInt(r.objectid ?? "");
      if (objectid == null || !objectIds.has(objectid)) continue;
      termBatch.push(chunk);
      if (termBatch.length >= NGA_LOADER_BATCH_SIZE) {
        db.transaction(() => {
          for (const { header: h, row } of termBatch) {
            const rr = loadRowMap(h, row);
            const oid = toInt(rr.objectid ?? "")!;
            const tid = toInt(rr.termid ?? "") ?? ++termId;
            insertTerm.run(tid, oid, rr.termtype ?? null, rr.term ?? null);
          }
        })();
        termBatch = [];
      }
    }
    if (termBatch.length > 0) {
      db.transaction(() => {
        for (const { header: h, row } of termBatch) {
          const rr = loadRowMap(h, row);
          const oid = toInt(rr.objectid ?? "")!;
          const tid = toInt(rr.termid ?? "") ?? ++termId;
          insertTerm.run(tid, oid, rr.termtype ?? null, rr.term ?? null);
        }
      })();
    }

    db.close();
    console.log(`Database written to ${dbPath}`);
  }

  async search(options: SearchOptions): Promise<ArtworkResult[]> {
    const { limit, page, hasImageOnly } = this.withDefaults(options);
    if (hasImageOnly === false) {
      // Still require at least one image; JOIN already enforces that.
    }
    const params: (string | number)[] = [];
    const where = buildSearchWhere(options, params);
    const sql = `${SEARCH_BASE}${where} ORDER BY o.objectid LIMIT ? OFFSET ?`;
    params.push(limit, page * limit);

    const db = getDb();
    const rows = db.query(sql).all(...params) as NgaObjectRow[];
    if (rows.length === 0) return [];

    const objectIds = rows.map((r) => r.objectid);

    const artistsStmt = db.prepare(`
      SELECT oc.objectid, c.preferreddisplayname, oc.roletype, oc.role,
             c.nationality, c.beginyear, c.endyear
      FROM objects_constituents oc
      JOIN constituents c ON c.constituentid = oc.constituentid
      WHERE oc.objectid IN (${objectIds.map(() => "?").join(",")})
        AND oc.roletype = 'artist'
      ORDER BY oc.objectid, oc.displayorder
    `);
    const artistRows = artistsStmt.all(...objectIds) as Array<{
      objectid: number;
      preferreddisplayname: string | null;
      roletype: string | null;
      role: string | null;
      nationality: string | null;
      beginyear: number | null;
      endyear: number | null;
    }>;

    const termsStmt = db.prepare(`
      SELECT objectid, termtype, term
      FROM objects_terms
      WHERE objectid IN (${objectIds.map(() => "?").join(",")})
    `);
    const termRows = termsStmt.all(...objectIds) as Array<{
      objectid: number;
      termtype: string | null;
      term: string | null;
    }>;

    const artistsByObject = new Map<number, Artist[]>();
    for (const a of artistRows) {
      const list = artistsByObject.get(a.objectid) ?? [];
      list.push({
        name: a.preferreddisplayname?.trim() ?? "Unknown",
        role: a.role ?? a.roletype ?? undefined,
        nationality: a.nationality ?? undefined,
        birthYear: a.beginyear ?? undefined,
        deathYear: a.endyear ?? undefined,
      });
      artistsByObject.set(a.objectid, list);
    }

    const termsByObject = new Map<
      number,
      { tags: string[]; classifications: string[] }
    >();
    for (const t of termRows) {
      const key = t.objectid;
      const cur = termsByObject.get(key) ?? { tags: [], classifications: [] };
      const term = t.term?.trim();
      if (!term) {
        termsByObject.set(key, cur);
        continue;
      }
      const type = (t.termtype ?? "").toLowerCase();
      if (
        type === "theme" ||
        type === "style" ||
        type === "school" ||
        type === "keyword"
      ) {
        cur.tags.push(term);
      }
      if (type === "style" || type === "school") {
        cur.classifications.push(term);
      }
      termsByObject.set(key, cur);
    }

    const results: ArtworkResult[] = [];
    for (const row of rows) {
      const artists = artistsByObject.get(row.objectid) ?? [];
      const { tags = [], classifications = [] } =
        termsByObject.get(row.objectid) ?? {};
      const uniqTags = normalizeStringArray(tags);
      const uniqClass = normalizeStringArray(classifications);
      results.push(
        rowToArtworkResult(
          row,
          artists,
          uniqTags,
          uniqClass,
          this.id,
          this.createGlobalId.bind(this),
        ),
      );
    }
    return results;
  }

  async getById(localId: string): Promise<ArtworkResult | null> {
    const objectId = Number.parseInt(localId, 10);
    if (Number.isNaN(objectId)) return null;

    const db = getDb();
    const row = db.query(`${SEARCH_BASE} WHERE o.objectid = ?`).get(objectId) as
      | NgaObjectRow
      | undefined;
    if (!row) return null;

    const artistRows = db
      .query(
        `SELECT c.preferreddisplayname, oc.roletype, oc.role, c.nationality, c.beginyear, c.endyear
         FROM objects_constituents oc
         JOIN constituents c ON c.constituentid = oc.constituentid
         WHERE oc.objectid = ? AND oc.roletype = 'artist'
         ORDER BY oc.displayorder`,
      )
      .all(objectId) as NgaConstituentRow[];

    const artists: Artist[] = artistRows.map((a) => ({
      name: a.preferreddisplayname?.trim() ?? "Unknown",
      role: a.role ?? a.roletype ?? undefined,
      nationality: a.nationality ?? undefined,
      birthYear: a.beginyear ?? undefined,
      deathYear: a.endyear ?? undefined,
    }));

    const termRows = db
      .query(`SELECT termtype, term FROM objects_terms WHERE objectid = ?`)
      .all(objectId) as NgaTermRow[];

    const tags: string[] = [];
    const classifications: string[] = [];
    for (const t of termRows) {
      const term = t.term?.trim();
      if (!term) continue;
      const type = (t.termtype ?? "").toLowerCase();
      if (
        type === "theme" ||
        type === "style" ||
        type === "school" ||
        type === "keyword"
      ) {
        tags.push(term);
      }
      if (type === "style" || type === "school") {
        classifications.push(term);
      }
    }

    return rowToArtworkResult(
      row,
      artists,
      normalizeStringArray(tags),
      normalizeStringArray(classifications),
      this.id,
      this.createGlobalId.bind(this),
    );
  }
}

// ---------------------------------------------------------------------------
// Data loader: load NGA CSV files into SQLite (processed/opendata.db)
// ---------------------------------------------------------------------------

const NGA_LOADER_SCHEMA = `
CREATE TABLE IF NOT EXISTS objects (objectid INTEGER PRIMARY KEY, accessioned INTEGER, title TEXT, displaydate TEXT, beginyear INTEGER, endyear INTEGER, medium TEXT, dimensions TEXT, creditline TEXT, provenancetext TEXT, classification TEXT, subclassification TEXT, departmentabbr TEXT, attribution TEXT);
CREATE TABLE IF NOT EXISTS published_images (uuid TEXT, iiifurl TEXT, iiifthumburl TEXT, viewtype TEXT, sequence INTEGER, depictstmsobjectid INTEGER, PRIMARY KEY (uuid));
CREATE INDEX IF NOT EXISTS idx_published_images_depict ON published_images(depictstmsobjectid);
CREATE INDEX IF NOT EXISTS idx_published_images_sequence ON published_images(depictstmsobjectid, sequence);
CREATE TABLE IF NOT EXISTS objects_constituents (objectid INTEGER, constituentid INTEGER, displayorder INTEGER, roletype TEXT, role TEXT, PRIMARY KEY (objectid, constituentid, displayorder));
CREATE INDEX IF NOT EXISTS idx_oc_objectid ON objects_constituents(objectid);
CREATE INDEX IF NOT EXISTS idx_oc_constituentid ON objects_constituents(constituentid);
CREATE TABLE IF NOT EXISTS constituents (constituentid INTEGER PRIMARY KEY, preferreddisplayname TEXT, nationality TEXT, beginyear INTEGER, endyear INTEGER);
CREATE TABLE IF NOT EXISTS objects_terms (termid INTEGER, objectid INTEGER, termtype TEXT, term TEXT, PRIMARY KEY (termid, objectid));
CREATE INDEX IF NOT EXISTS idx_ot_objectid ON objects_terms(objectid);
`;

function loadParseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cur += c;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function* loadReadCsv(
  filePath: string,
): AsyncGenerator<{ header: string[]; row: string[] }> {
  const file = Bun.file(filePath);
  const stream = file.stream();
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buffer = "";
  let header: string[] | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const row = loadParseCsvLine(line);
      if (!header) {
        header = row;
        continue;
      }
      if (header && row.length >= header.length) {
        yield { header, row: row.slice(0, header.length) };
      }
    }
  }
  if (buffer.trim() && header) {
    const row = loadParseCsvLine(buffer);
    if (row.length >= header.length)
      yield { header, row: row.slice(0, header.length) };
  }
}

function loadRowMap(header: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    out[header[i].toLowerCase()] = row[i] ?? "";
  }
  return out;
}

const NGA_LOADER_BATCH_SIZE = 5000;

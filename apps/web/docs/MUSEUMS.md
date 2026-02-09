# Museum Collections Architecture

## Overview
The museum collections layer reads from local SQLite databases (one per museum) and exposes a consistent TypeScript interface for searching artworks. The normalized output is designed to be stored in `MuseumArtwork` records for curated selections and future syncing.

## Core Classes

```
MuseumCollections
├── search(options) → ArtworkResult[]
├── getById(globalId) → ArtworkResult | null
└── registerMuseum(museum)

Museum (abstract)
├── id, name
├── search(options)
├── getById(localId)
└── getDataSource(options)
```

Adapters and script-only code live under `apps/web/scripts/museums/` (used by `scripts/museum.ts` and `scripts/sync-museum-sources.ts`):
- `ClevelandMuseum` (local SQLite)
- `ArtInstituteChicagoMuseum`
- `NationalGalleryOfArtMuseum` (NGA; local SQLite)

Each adapter class implements **data loading** via the abstract `loadDataIntoSqlite(sourcePath)` method: the Art Institute reads JSON artwork files from a directory, Cleveland reads a single CSV, and NGA reads a directory of CSVs. Use the unified script **`scripts/museum.ts`** with the **`load`** action: `bun run scripts/museum.ts load` (loads all museums from their default source paths) or `bun run scripts/museum.ts load --museum artic` to load only one. See the script’s `load --help` for options.

## File Structure

```
apps/web/scripts/museums/     # Script-only: search & sync
├── index.ts
├── museum.ts
├── museum-collections.ts
├── adapters/
└── utils/                     # normalize-artist, parse-medium, normalize

apps/web/lib/museums/          # App runtime: queries, display, types
├── index.ts
├── types.ts
├── constants.ts
├── museum-display-names.ts
├── queries.ts
└── ...
```

## Normalized Output

`ArtworkResult` fields are normalized for search and storage:

- `title`, `description`
- `artists[]` (normalized artist info)
- `imageUrl`, `thumbnailUrl`, `additionalImages[]` — all are **direct image URLs** (usable in `<img src>`; no HTML pages). Cleveland uses CDN links from the dump; AIC and NGA build IIIF URLs from image IDs.
- `mediums[]` and `mediumDisplay` (searchable mediums like "Oil", "Photography")
- `genres[]` (e.g., "Impressionism")
- `classifications[]` (e.g., "Painting")
- `tags[]` (subject keywords)
- `dateCreated`, `dateStart`, `dateEnd`
- `dimensions`, `department`, `culture`, `creditLine`, `provenance`
- `isPublicDomain`, `sourceUrl`, `rawMetadata`

## Search Options

```ts
interface SearchOptions {
  query: string;
  limit?: number;
  page?: number;
  publicDomainOnly?: boolean;
  hasImageOnly?: boolean;
  museums?: string[];
  artists?: string[];  // filter by artist name (partial, case-insensitive)
  mediums?: string[];
  genres?: string[];
  classifications?: string[];
  dateRange?: { start: number; end: number };
}
```

## Environment Variables

Museum data is read from local SQLite databases; no API keys are used. Optional overrides: `CMA_OPENDATA_DB_PATH`, `ARTIC_OPENDATA_DB_PATH`, `NGA_OPENDATA_DB_PATH` to point to database files.

## Database Models

`MuseumArtwork` stores normalized records for curated pieces. Key searchable columns include `mediums`, `genres`, `classifications`, `tags`, and `description`. `MuseumSource` tracks per-museum configuration and sync status.

## Medium Normalization

Mediums are parsed into searchable tokens (e.g., "Oil on canvas" → `["Oil", "Canvas"]`). Keyword mapping ensures searches like "photography" match gelatin silver prints, daguerreotypes, and similar media.

## Artist Name Normalization

When saving to the database via `scripts/museum.ts --save`, artist names are normalized so the same person does not appear under multiple variants in the museums UI filter. `normalizeArtistName()` (in `scripts/museums/utils/normalize-artist.ts`):

- Trims and collapses whitespace.
- Converts "Last, First" or "Last, First Middle" to "First [Middle] Last".
- Applies title-case but keeps particles (van, de, von, etc.) lowercase in the middle of the name.

Example: "Gogh, Vincent van", "Vincent van Gogh", and "Van Gogh, Vincent" all become **Vincent van Gogh**. Existing records in the database keep their original names until they are re-synced; re-run the search script with `--save` for the museums/searches you care about to backfill normalized names.

## SearchOptions → SQLite Query Mapping

Each adapter maps `SearchOptions` fields to SQLite queries. All adapters support artist-only and genre-only searches (no keyword query required).

| SearchOptions | Cleveland | AIC | NGA |
|---|---|---|---|
| `query` | `title`/`description` LIKE | `title`/`description` LIKE | `title`/`attribution` LIKE |
| `artists` | creators `description` LIKE | `artist_title` LIKE | constituents (artist) LIKE |
| `genres` | `type` = (object types) | `classification_titles` (object types) or `style_titles` (styles) | `classification`/terms LIKE |
| `mediums` | `technique` LIKE | `medium_display` LIKE | — |
| `classifications` | — | `classification_titles` LIKE | `classification`/terms |
| `dateRange` | `creation_date_earliest`/`creation_date_latest` | `date_start`/`date_end` | `beginyear`/`endyear` |
| `publicDomainOnly` | `share_license_status = 'CC0'` | `is_public_domain = 1` | N/A (all open) |
| `hasImageOnly` | `images IS NOT NULL` | `image_id IS NOT NULL` | JOIN `published_images` |

**Notes:**
- **Cleveland Museum of Art**: Local SQLite database (`data/museums/clevelandmuseumofart/opendata.db`). Uses Bun's built-in SQLite; requires Bun runtime. Query runs against `artworks`; creators from `creators` table; cultures from `cultures` table; alternate images from `alternate_images` table. Image URLs are direct CDN links from the open-access dump.
- **Art Institute of Chicago (AIC)**: Local SQLite database (`data/museums/artic/opendata.db`). Uses Bun's built-in SQLite; requires Bun runtime. Query runs against `artworks`; array fields (classifications, styles, subjects, terms) from child tables. Image URLs built via IIIF: `https://www.artic.edu/iiif/2/{image_id}/full/{size},/0/default.jpg`.
- **NGA (National Gallery of Art)**: Local SQLite database (`data/museums/nationalmuseumofart/opendata.db`). Uses Bun's built-in SQLite; requires Bun runtime. Query runs against `objects` + `published_images`; artists from `constituents`/`objects_constituents`; terms from `objects_terms`. Image URL from IIIF info URL + `/full/full/0/default.jpg`.

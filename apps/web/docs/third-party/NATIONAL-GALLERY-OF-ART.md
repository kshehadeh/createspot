# National Gallery of Art Open Data (SQLite)

The NGA adapter reads from a local SQLite database (NGA Open Data) at `apps/web/data/museums/nationalmuseumofart/opendata.db`. It uses **Bun's built-in SQLite** (`bun:sqlite`); no API key and no network calls. Requires the Bun runtime.

## Data source

- **Path**: `data/museums/nationalmuseumofart/opendata.db` (relative to `apps/web`), or override with `NGA_OPENDATA_DB_PATH`.
- **Schema**: NGA TMS-style tables: `objects`, `published_images`, `objects_constituents`, `constituents`, `objects_terms`, etc.

## Key tables

| Table | Purpose |
|-------|---------|
| `objects` | Artwork metadata: objectid, title, displaydate, beginyear, endyear, medium, dimensions, creditline, provenancetext, classification, subclassification, departmentabbr |
| `published_images` | Image links: uuid, iiifurl (IIIF Image API info URL), iiifthumburl (direct thumbnail), depictstmsobjectid → objects.objectid |
| `objects_constituents` | Links objects to constituents; roletype (e.g. artist), displayorder |
| `constituents` | People/orgs: preferreddisplayname, nationality, beginyear, endyear |
| `objects_terms` | Terms per object: termtype (Keyword, Theme, Style, School), term |

## ArtworkResult mapping

| ArtworkResult | Source |
|---------------|--------|
| globalId | `nga:{objectid}` |
| localId | `objects.objectid` |
| title | `objects.title` |
| artists | `constituents.preferreddisplayname` + role/nationality/dates where `objects_constituents.roletype = 'artist'` |
| imageUrl | `published_images.iiifurl` + `/full/full/0/default.jpg` (IIIF Image API) |
| thumbnailUrl | `published_images.iiifthumburl` |
| mediums / mediumDisplay | `parseMediums(objects.medium)` |
| genres / classifications | `objects.classification`, `subclassification`; `objects_terms` (Theme, Style, School) |
| tags | `objects_terms.term` (Keyword, Theme, etc.) |
| dateCreated | `objects.displaydate` |
| dateStart / dateEnd | `objects.beginyear`, `objects.endyear` |
| dimensions | `objects.dimensions` |
| department | `objects.departmentabbr` |
| creditLine / provenance | `objects.creditline`, `provenancetext` |
| isPublicDomain | `true` (NGA open data) |
| sourceUrl | `https://www.nga.gov/collection/art-object-page.{objectid}.html` |

## Search behavior

- **Query**: `title` and `attribution` LIKE `%query%`.
- **Artists**: The adapter splits the artist input into words and requires **all words** to appear in `constituents.preferreddisplayname` (in any order). This handles NGA's "Last, First" format:
  - `--artist "van gogh"` matches `"Gogh, Vincent van"` ✓
  - `--artist "vincent van gogh"` matches `"Gogh, Vincent van"` ✓
  - `--artist "matisse"` matches `"Matisse, Henri"` ✓
  - Filter uses: `objects_constituents.roletype = 'artist'` joined with `constituents` table.
- **Genres / classifications**: `classification` or `subclassification` LIKE, plus `objects_terms` (Theme, Style, School).
- **Date range**: `beginyear`/`endyear` overlap with requested range.
- **Has image**: Enforced by INNER JOIN on `published_images`; one primary image per object (lowest `sequence`).

## Image URLs

`published_images.iiifurl` is the IIIF Image API info document (JSON). The adapter appends `/full/full/0/default.jpg` to produce a direct image URL. Thumbnail is taken from `iiifthumburl` as-is.

## Refreshing the database

The SQLite DB is built from the [NGA Open Data](https://github.com/NationalGalleryOfArt/opendata) repo CSVs (`objects.csv`, `published_images.csv`, `objects_constituents.csv`, `constituents.csv`, `objects_terms.csv`). Copy those files into a directory (e.g. `apps/web/data/museums/nga/raw/`), then run the unified loader:

```bash
bun run scripts/museum.ts load --museum nga
```

The script uses each museum’s default source path (for NGA, `data/museums/nga/raw/`). Output: `apps/web/data/museums/nga/processed/opendata.db` (or `NGA_OPENDATA_DB_PATH` if set).

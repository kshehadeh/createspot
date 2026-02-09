# Art Institute of Chicago — Open Data

This folder holds (after running the loader) the SQLite database used by the app. The **raw data is not stored in this repo**; you must download it separately. Load logic lives in `scripts/museums/adapters/art-institute-chicago.ts` and is invoked via the unified script `scripts/museum.ts load`.

**Folder layout:**

- **`raw/`** — Put the source data dump here (e.g. the extracted `artic-api-data` tree).
- **`processed/`** — The loader writes the generated SQLite database here (`processed/opendata.db`).

## 1. Download the raw data

The Art Institute of Chicago provides a full API data dump as a compressed archive:

- **URL:** https://artic-api-data.s3.amazonaws.com/artic-api-data.tar.bz2  
- **Size:** ~75 MB compressed, ~1.75 GB extracted  
- **Update schedule:** Monthly (see [artic-api-data repo](https://github.com/art-institute-of-chicago/api-data))

**Steps:**

1. Create the `raw` folder in this directory if it doesn’t exist.
2. Download and extract the archive into `raw/`:
   ```bash
   cd apps/web/data/museums/artic
   mkdir -p raw
   cd raw
   curl -L -o artic-api-data.tar.bz2 https://artic-api-data.s3.amazonaws.com/artic-api-data.tar.bz2
   tar -xjf artic-api-data.tar.bz2
   ```
3. You should have `raw/artic-api-data/json/artworks/` containing one JSON file per artwork (e.g. `12345.json`).

## 2. Load the data into SQLite

From the **apps/web** directory (or project root), run the unified museum script:

```bash
bun run scripts/museum.ts load --museum artic
```

If you put the extracted data in `raw/` as above, the script uses the default path (`data/museums/artic/raw/artic-api-data/json/artworks`). To load all museums at once: `bun run scripts/museum.ts load`.

**Output:** `apps/web/data/museums/artic/processed/opendata.db`

The app uses this SQLite database for local search; no API key or network calls are required at runtime.

## References

- [Art Institute of Chicago API documentation](https://api.artic.edu/docs/)
- [Full dataset description](https://github.com/art-institute-of-chicago/api-data) (sample data and download link)

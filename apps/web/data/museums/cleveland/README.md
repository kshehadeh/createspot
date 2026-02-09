# Cleveland Museum of Art — Open Data

This folder holds (after running the loader) the SQLite database used by the app. The **raw data is not stored in this repo**; you must download it separately. Load logic lives in `scripts/museums/adapters/cleveland.ts` and is invoked via the unified script `scripts/museum.ts load`.

**Folder layout:**

- **`raw/`** — Put the source data dump here (e.g. `data.csv` from the CMA repo).
- **`processed/`** — The loader writes the generated SQLite database here (`processed/opendata.db`).

## 1. Download the raw data

The Cleveland Museum of Art publishes the full collection as **CSV** and **JSON** in a GitHub repo. The files are large and use **Git LFS** (Large File Storage).

- **Repo:** https://github.com/ClevelandMuseumArt/openaccess  
- **Files:** `data.csv` (and `data.json`) in the repo root  
- **Content:** 60,000+ artwork records; field reference: [API documentation](http://openaccess-api.clevelandart.org/#fields)

**Steps:**

1. Install [Git LFS](https://git-lfs.github.com/) if you don’t have it.
2. Create the `raw` folder in this directory and clone the repo (or copy `data.csv`) into `raw/`:
   ```bash
   cd apps/web/data/museums/cleveland
   mkdir -p raw
   cd raw
   git clone https://github.com/ClevelandMuseumArt/openaccess.git .
   git lfs pull
   ```
3. You should have `raw/data.csv` in this museum folder.

## 2. Load the data into SQLite

From the **apps/web** directory (or project root), run the unified museum script:

```bash
bun run scripts/museum.ts load --museum cleveland
```

If you put `data.csv` in `raw/` as above, the script uses the default path. To load all museums at once: `bun run scripts/museum.ts load`.

**Output:** `apps/web/data/museums/cleveland/processed/opendata.db`

The app uses this SQLite database for local search; no API key or network calls are required at runtime.

## References

- [Cleveland Museum of Art Open Access](https://github.com/ClevelandMuseumArt/openaccess)  
- [Open Access API](https://openaccess-api.clevelandart.org/)

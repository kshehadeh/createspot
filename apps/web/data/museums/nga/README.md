# National Gallery of Art — Open Data

This folder holds (after running the loader) the SQLite database used by the app. The **raw data is not stored in this repo**; you must download it separately. Load logic lives in `scripts/museums/adapters/national-gallery-of-art.ts` and is invoked via the unified script `scripts/museum.ts load`.

**Folder layout:**

- **`raw/`** — Put the source data CSVs here (the contents of the NGA repo’s `data/` folder: `objects.csv`, `published_images.csv`, etc.).
- **`processed/`** — The loader writes the generated SQLite database here (`processed/opendata.db`).

## 1. Download the raw data

The National Gallery of Art publishes the collection as **CSV** files in a GitHub repo. The loader expects these files in a single directory (the repo’s `data/` folder).

- **Repo:** https://github.com/NationalGalleryOfArt/opendata  
- **Data directory:** `data/` inside the repo (contains `objects.csv`, `published_images.csv`, etc.)  
- **Data dictionary:** [documentation](https://github.com/NationalGalleryOfArt/opendata/tree/main/documentation) in the repo

**Steps:**

1. Clone the repo and copy the `data/` contents into this museum folder’s `raw/` directory:
   ```bash
   cd apps/web/data/museums/nga
   mkdir -p raw
   git clone --depth 1 https://github.com/NationalGalleryOfArt/opendata.git nga-opendata
   cp nga-opendata/data/*.csv raw/
   ```
2. Required files in `raw/` include:
   - `objects.csv`
   - `published_images.csv`
   - `objects_constituents.csv`
   - `constituents.csv`
   - `objects_terms.csv`

## 2. Load the data into SQLite

From the **apps/web** directory (or project root), run the unified museum script:

```bash
bun run scripts/museum.ts load --museum nga
```

If the CSVs are in `raw/` as above, the script uses the default path. To load all museums at once: `bun run scripts/museum.ts load`.

**Output:** `apps/web/data/museums/nga/processed/opendata.db`

The app uses this SQLite database for local search; no API key or network calls are required at runtime.

## References

- [National Gallery of Art Open Data](https://github.com/NationalGalleryOfArt/opendata)  
- [Data dictionary](https://github.com/NationalGalleryOfArt/opendata/tree/main/documentation)

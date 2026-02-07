# Cleveland Museum of Art Open Access API: Query → Actual Image URLs (Practical Guide)

This is a pragmatic "how do I get real image URLs back?" guide for the [Cleveland Museum of Art Open Access API](https://openaccess-api.clevelandart.org/).

The **big idea**:  
The API **returns direct image URLs** in the response. Each artwork can include an `images` object with `web`, `print`, and `full` assets—each with a `url` you can use in `<img src="...">`. Use `has_image=1` to return only artworks that have a web image. Use `cc0` to restrict to CC0 (public domain) works that include image assets.

---

## Endpoints you'll use

### 1) Search artworks
Search by keyword and filters. Returns a list with metadata and image links.

```
GET https://openaccess-api.clevelandart.org/api/artworks/
  ?q=YOUR_QUERY
  &has_image=1
  &cc0
  &skip=0
  &limit=100
  &fields=id,accession_number,title,creators,share_license_status,images,url
```

- `q` — Keyword or phrase; searches title, creator, description, and other fields
- `has_image` — `1` to return only artworks that have a web image (recommended when you need images)
- `cc0` — No value. Filters to works with [CC0](https://creativecommons.org/share-your-work/public-domain/cc0/) share license (image assets are provided for CC0 works)
- `copyrighted` — No value. Filters to works with some form of copyright
- `skip` — Offset for pagination (e.g. `skip=1000&limit=1000` for page 2)
- `limit` — Page size (default returns up to **1000** per request)
- `fields` — Comma-delimited list of fields to return (optional; omit for all fields)

Other useful filters: `department`, `type`, `artists`, `title`, `created_after`, `created_before`, `currently_on_view`. See the [official API docs](https://openaccess-api.clevelandart.org/) for the full list.

### 2) Single artwork
Fetch one artwork by **Athena id** (numeric) or **accession number** (e.g. `1953.424`).

```
GET https://openaccess-api.clevelandart.org/api/artworks/{id}
```

Example by accession number:

```
GET https://openaccess-api.clevelandart.org/api/artworks/1953.424
```

---

## What "actual image" means in the response

Artwork records can include an `images` object with up to three assets:

| Key    | Description                    | Typical use        |
|--------|--------------------------------|--------------------|
| `web`  | ~900px longest side, 300 dpi, JPEG | Thumbnails, cards, web |
| `print`| ~3400px longest side, 300 dpi, JPEG | High-res for print/preview |
| `full` | Full resolution, TIFF         | Archival / download |

Each asset has `url`, `filename`, `filesize`, `width`, and `height`. Use the `url` directly in `<img src="...">` or for download.

Example:

```json
"images": {
  "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1998.78.14/1998.78.14_web.jpg",
    "filename": "1998.78.14_web.jpg",
    "filesize": "718224",
    "width": "956",
    "height": "893"
  },
  "print": { "url": "https://openaccess-cdn.clevelandart.org/1998.78.14/1998.78.14_print.jpg", ... },
  "full": { "url": "https://openaccess-cdn.clevelandart.org/1998.78.14/1998.78.14_full.tif", ... }
}
```

Only artworks with `share_license_status: "CC0"` include image URLs; copyrighted works may have metadata but no `images` in the response. Use `has_image=1` on search so the API returns only records that have a web image.

---

## A working search strategy

### Step 1 — Require images
Add `has_image=1` so only artworks with a web image are returned.

### Step 2 — Restrict to CC0 if you need image assets
Add `cc0` to the query. CC0 works include the image links; non-CC0 works do not expose image URLs in this API.

### Step 3 — Paginate with skip/limit
Use `skip` and `limit` (e.g. `limit=100`, then `skip=100`, `skip=200`, …). Maximum `limit` per request is 1000.

### Step 4 — Optionally restrict fields
Use `fields=id,accession_number,title,creators,share_license_status,images,url` to keep responses smaller.

---

## Extracting image URLs from a response

**Search response** (`GET /api/artworks/`): response has `data` as an array.

- For each item in `data`, check `artwork.images?.web?.url` (or `print` / `full`).
- If present, use it directly.

**Single artwork** (`GET /api/artworks/{id}`): response has `data` as a single object.

- Use `data.images.web.url` for the standard web image, or `data.images.print.url` / `data.images.full.url` as needed.

Some artworks also have `alternate_images` (detail views, alternate angles)—same structure (web/print/full with `url`).

---

## TypeScript example

```ts
interface CMAImageAsset {
  url: string;
  filename: string;
  filesize: string;
  width: string;
  height: string;
}

interface CMAArtwork {
  id: number;
  accession_number: string;
  title: string;
  share_license_status: string;
  creators?: Array<{ description: string; name_in_original_language?: string | null }>;
  images?: {
    web?: CMAImageAsset;
    print?: CMAImageAsset;
    full?: CMAImageAsset;
  };
  url?: string;
}

interface CMASearchResponse {
  info: { total: number; parameters: Record<string, string> };
  data: CMAArtwork[];
}

function getWebImageUrl(artwork: CMAArtwork): string | null {
  return artwork.images?.web?.url ?? null;
}

function getPrintImageUrl(artwork: CMAArtwork): string | null {
  return artwork.images?.print?.url ?? null;
}
```

### Example: search and collect image records

```ts
async function searchArtworksWithImages(
  query: string,
  options: { limit?: number; cc0Only?: boolean } = {}
) {
  const { limit = 25, cc0Only = true } = options;
  const results: { id: number; title: string; accession_number: string; imageUrl: string }[] = [];
  let skip = 0;

  while (results.length < limit) {
    const url = new URL("https://openaccess-api.clevelandart.org/api/artworks/");
    url.searchParams.set("q", query);
    url.searchParams.set("has_image", "1");
    if (cc0Only) url.searchParams.set("cc0", "");
    url.searchParams.set("skip", String(skip));
    url.searchParams.set("limit", "100");
    url.searchParams.set(
      "fields",
      "id,accession_number,title,share_license_status,images,url"
    );

    const res = await fetch(url);
    const data = (await res.json()) as CMASearchResponse;

    const artworks = data?.data ?? [];
    if (artworks.length === 0) break;

    for (const artwork of artworks) {
      const imageUrl = getWebImageUrl(artwork);
      if (!imageUrl) continue;

      results.push({
        id: artwork.id,
        title: artwork.title ?? "",
        accession_number: artwork.accession_number ?? "",
        imageUrl,
      });

      if (results.length >= limit) break;
    }

    skip += artworks.length;
    if (artworks.length < 100) break;
  }

  return results;
}
```

---

## Authentication and rate limits

- **No API key** required. The Open Access API is public.
- Data and (for CC0 works) image assets are made available under [CC0](https://clevelandart.org/open-access). Check `share_license_status` and the [CMA Open Access](https://clevelandart.org/open-access) page for terms.

---

## Common pitfalls

- Without `has_image=1`, many results will have no `images` object; filter or post-filter for records that have `images.web.url`.
- Only CC0-designated works include image URLs; use the `cc0` filter if you only want works with image assets.
- `limit` can be up to 1000 per request; use `skip` for further pages.
- Single artwork `{id}` can be numeric (Athena id) or accession number (e.g. `1953.424`).

---

## Recommended default approach

- **Query:**  
  `q=your_keyword&has_image=1&cc0`

- **Pagination:**  
  `skip=0&limit=100` (then increment `skip` by 100).

- **Image URL:**  
  Use `data.images.web.url` (or `data.images.print.url` for higher resolution) directly—no URL construction needed.

This is the most reliable way to get actual image URLs from the Cleveland Museum of Art Open Access API.

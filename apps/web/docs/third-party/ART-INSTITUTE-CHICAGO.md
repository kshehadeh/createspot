# Art Institute of Chicago API: Query → Actual Image URLs (Practical Guide)

This is a pragmatic "how do I get real image URLs back?" guide for the [Art Institute of Chicago API](https://api.artic.edu/docs/).

The **big idea**:  
The API does **not** return image URLs directly. It returns metadata including an `image_id`. You must **construct** IIIF (International Image Interoperability Framework) URLs using `image_id` + the base IIIF URL from `config.iiif_url`. Only artworks with a non-null `image_id` have displayable images.

---

## Endpoints you'll use

### 1) Search
Use this to find candidate artworks by keyword or Elasticsearch query.

```
GET https://api.artic.edu/api/v1/artworks/search
  ?q=YOUR_QUERY
  &query[term][is_public_domain]=true   # optional: filter to public domain only
  &limit=12
  &page=1
  &fields=id,title,artist_display,image_id
```

- `q` — full-text search query
- `query[term][field]=value` — Elasticsearch term filters (e.g. `is_public_domain`, `artist_id`)
- `limit` — page size (default 12, max 100)
- `page` — 1-based page number
- `fields` — comma-separated list; always include `image_id` if you need images

### 2) Listing
Get a paginated list of artworks (sorted by last updated, descending).

```
GET https://api.artic.edu/api/v1/artworks
  ?limit=12
  &page=1
  &fields=id,title,artist_display,image_id
```

### 3) Detail (single artwork)
Fetch one artwork by ID.

```
GET https://api.artic.edu/api/v1/artworks/{id}
  ?fields=id,title,artist_display,image_id,alt_image_ids
```

### 4) Batch detail
Fetch multiple artworks by ID in one request.

```
GET https://api.artic.edu/api/v1/artworks?ids=27992,28560,24645&fields=id,title,image_id
```

---

## What "actual image" means in the response

The API **never** returns image URLs. It returns:

- `data.image_id` — UUID string used to build the IIIF URL (e.g. `2d484387-2509-5e8e-2c43-22f9981972eb`)
- `config.iiif_url` — Base IIIF Image API endpoint (e.g. `https://www.artic.edu/iiif/2`)

An artwork has a displayable image **only if** `data.image_id` is non-null.

Some artworks also have `alt_image_ids` (array of additional image IDs for alternate views).

---

## Constructing real image URLs

### Step 1 — Fetch artwork(s) with `image_id`

Always request the `image_id` field. Example:

```
GET https://api.artic.edu/api/v1/artworks/27992?fields=id,title,image_id
```

Response:

```json
{
  "data": {
    "id": 27992,
    "title": "A Sunday on La Grande Jatte —1884",
    "image_id": "2d484387-2509-5e8e-2c43-22f9981972eb"
  },
  "config": {
    "iiif_url": "https://www.artic.edu/iiif/2"
  }
}
```

### Step 2 — Build the IIIF URL

Use this pattern (recommended by AIC for best cache hits):

```
{config.iiif_url}/{image_id}/full/843,/0/default.jpg
```

Example:

```
https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg
```

This URL is directly usable in `<img src="...">`. CORS is enabled.

### Step 3 — Other useful sizes

For smaller thumbnails or larger images:

```
/full/200,/0/default.jpg   # small
/full/400,/0/default.jpg
/full/600,/0/default.jpg
/full/843,/0/default.jpg  # recommended default
/full/1686,/0/default.jpg # larger (prefer for public domain only)
```

---

## A working search strategy

### Step 1 — Filter for artworks with images

Only artworks with `image_id` have images. Post-filter results:

```ts
if (artwork.image_id == null) return; // skip
```

Or use an Elasticsearch `exists` query if the API supports it for `image_id`.

### Step 2 — Restrict to public domain (recommended)

```
query[term][is_public_domain]=true
```

### Step 3 — Use `fields` to reduce payload

```
fields=id,title,artist_display,image_id
```

### Step 4 — Paginate

- Default: 12 per page. Max: 100 per page.
- Search is limited to 10,000 total results. For larger datasets, use [data dumps](https://github.com/art-institute-of-chicago/api-data).

---

## Extracting image URLs from a response

For each artwork in `response.data`:

1. Check `artwork.image_id` is non-null.
2. Get `config.iiif_url` from the response (or use `https://www.artic.edu/iiif/2` — but prefer reading from `config`).
3. Build: `${config.iiif_url}/${artwork.image_id}/full/843,/0/default.jpg`

---

## TypeScript example

```ts
interface AICArtwork {
  id: number;
  title: string;
  image_id: string | null;
  artist_display?: string | null;
}

interface AICResponse {
  data: AICArtwork | AICArtwork[];
  config: { iiif_url: string };
}

function buildImageUrl(iiifUrl: string, imageId: string, size = 843): string {
  return `${iiifUrl}/${imageId}/full/${size},/0/default.jpg`;
}

function extractImageUrlFromArtwork(
  artwork: AICArtwork,
  iiifUrl: string
): string | null {
  if (!artwork.image_id) return null;
  return buildImageUrl(iiifUrl, artwork.image_id);
}
```

### Example: search and collect image records

```ts
async function searchArtworksWithImages(
  query: string,
  targetCount = 25,
  limit = 25
) {
  const results: { id: number; title: string; imageUrl: string }[] = [];
  let page = 1;

  while (results.length < targetCount) {
    const url = new URL("https://api.artic.edu/api/v1/artworks/search");
    url.searchParams.set("q", query);
    url.searchParams.set("query[term][is_public_domain]", "true");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));
    url.searchParams.set("fields", "id,title,image_id");

    const res = await fetch(url, {
      headers: { "AIC-User-Agent": "my-app (your@email.com)" },
    });
    const data = (await res.json()) as {
      data: AICArtwork[];
      config: { iiif_url: string };
      pagination: { total_pages: number };
    };

    const artworks = data?.data ?? [];
    const iiifUrl = data?.config?.iiif_url ?? "https://www.artic.edu/iiif/2";

    for (const artwork of artworks) {
      const imageUrl = extractImageUrlFromArtwork(artwork, iiifUrl);
      if (!imageUrl) continue;

      results.push({
        id: artwork.id,
        title: artwork.title ?? "",
        imageUrl,
      });

      if (results.length >= targetCount) break;
    }

    if (artworks.length === 0) break;
    page++;
  }

  return results;
}
```

---

## IIIF Manifests (optional)

For IIIF-compliant tools (e.g. Mirador), you can get a manifest:

```
GET https://api.artic.edu/api/v1/artworks/{id}/manifest.json
```

This contains metadata and image references. The manifest does not add data beyond what the API provides; it's for interoperability.

---

## Authentication & rate limits

- **No API key required.** Anonymous users are throttled to 60 requests/minute per IP.
- **Recommended:** Add `AIC-User-Agent` header with your project name and contact:
  ```
  AIC-User-Agent: my-app (your@email.com)
  ```

---

## Common pitfalls

- `image_id` can be `null` — always check before building URLs.
- Do not hardcode `https://www.artic.edu/iiif/2`; prefer `config.iiif_url` when available.
- Search pagination is capped at 10,000 results; use data dumps for larger datasets.
- `limit` max is 100 per request.

---

## Recommended default approach

- **Query:**

  ```
  q=cats&query[term][is_public_domain]=true
  ```

- **Fields:**

  ```
  id,title,artist_display,image_id
  ```

- **Filter:** Skip records where `image_id` is null.

- **URL pattern:**

  ```
  {config.iiif_url}/{image_id}/full/843,/0/default.jpg
  ```

This is the most reliable way to retrieve actual image URLs from the Art Institute of Chicago API.

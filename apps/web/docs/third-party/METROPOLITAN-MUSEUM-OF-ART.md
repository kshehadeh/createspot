# The Metropolitan Museum of Art Collection API: Query → Actual Image URLs (Practical Guide)

This is a pragmatic "how do I get real image URLs back?" guide for The Met's [Collection API](https://metmuseum.github.io/).

The **big idea**:  
The API has **two steps**: **Search** returns only **object IDs**; you then fetch each **Object** by ID to get metadata and **direct image URLs** (`primaryImage`, `primaryImageSmall`, `additionalImages`). No API key is required. Use `hasImages=true` on search so only objects with images are returned. Image URLs are standard JPEGs on `images.metmuseum.org` and are included when the object has Open Access images (e.g. public domain).

---

## Endpoints you'll use

### 1) Search
Returns a list of **object IDs** that match the query—not full records or image URLs.

```
GET https://collectionapi.metmuseum.org/public/collection/v1/search
  ?q=YOUR_QUERY
  &hasImages=true
  &isPublicDomain=true   # optional: only public domain
```

- `q` — Search term; matched against object data (title, artist, culture, etc.)
- `hasImages` — `true` or `false`. Use `true` to return only objects that have images (recommended when you need image URLs).
- `isHighlight` — `true` / `false` — only highlights (selected works).
- `title` — `true` / `false` — restrict search to title field.
- `tags` — `true` / `false` — restrict search to subject keyword tags.
- `departmentId` — Integer; filter by department (get IDs from `/departments`).
- `isOnView` — `true` / `false` — only works currently on view.
- `artistOrCulture` — `true` / `false` — search artist name or culture.
- `medium` — String; e.g. `Paintings`, `Ceramics`. Multiple with `|`: `Quilts|Silk`.
- `geoLocation` — String; e.g. `France`, `Paris`. Multiple with `|`.
- `dateBegin` and `dateEnd` — Integers; use both for date range (e.g. `1700`–`1800`; negative for BCE).

**Response:** `{ "total": number, "objectIDs": number[] | null }`. If no results, `objectIDs` can be `null`—handle that in code.

### 2) Object (single record with image URLs)
Fetch one object by ID to get full metadata and image URLs.

```
GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}
```

Returns one JSON object with `primaryImage`, `primaryImageSmall`, `additionalImages`, `isPublicDomain`, `title`, `artistDisplayName`, and many other fields.

### 3) Objects (list of IDs, optional)
Get all valid object IDs (e.g. for scanning). Optional for the "search → image URL" flow.

```
GET https://collectionapi.metmuseum.org/public/collection/v1/objects
  ?departmentIds=1
  ?metadataDate=YYYY-MM-DD
```

- `departmentIds` — e.g. `1` or `3|9|12` (pipe-delimited). Returns up to 1000 object IDs.
- `metadataDate` — Only objects updated after this date.

### 4) Departments
List departments and their IDs (for filtering search or objects).

```
GET https://collectionapi.metmuseum.org/public/collection/v1/departments
```

---

## What "actual image" means in the response

**Search** does **not** return image URLs—only `objectIDs`. You must call the **Object** endpoint for each ID to get image fields.

**Object response** (`GET /objects/{objectID}`) can include:

| Field              | Type     | Description                                        |
|--------------------|----------|----------------------------------------------------|
| `primaryImage`     | string   | URL to the primary image (JPEG). Use in `<img src="...">`. |
| `primaryImageSmall`| string   | Lower-resolution primary image URL.                |
| `additionalImages` | string[] | URLs to additional images of the object.           |
| `isPublicDomain`   | boolean  | When `true`, the work is in the public domain.    |

If an object has no Open Access image, `primaryImage` will be an empty string. Check `primaryImage` (or `primaryImageSmall`) before using.

Example (snippet):

```json
{
  "objectID": 45734,
  "title": "Quail and Millet",
  "isPublicDomain": true,
  "primaryImage": "https://images.metmuseum.org/CRDImages/as/original/DP251139.jpg",
  "primaryImageSmall": "https://images.metmuseum.org/CRDImages/as/web-large/DP251139.jpg",
  "additionalImages": [
    "https://images.metmuseum.org/CRDImages/as/original/DP251138.jpg",
    "https://images.metmuseum.org/CRDImages/as/original/DP251120.jpg"
  ],
  "artistDisplayName": "Kiyohara Yukinobu",
  "department": "Asian Art"
}
```

---

## A working search strategy

### Step 1 — Search with hasImages
Call search with `q=...` and `hasImages=true` so you only get object IDs for works that have images.

### Step 2 — Fetch each object
For each ID in `objectIDs`, call `GET /public/collection/v1/objects/{objectID}`. Handle `objectIDs === null` (no results).

### Step 3 — Use primaryImage or primaryImageSmall
From each object, use `primaryImage` (or `primaryImageSmall` for thumbnails). Skip objects where `primaryImage` is empty.

### Step 4 — Optional: restrict to public domain
Use `isPublicDomain=true` in **search** (if supported; the docs list search params—when in doubt, filter in code using `object.isPublicDomain` after fetch).

---

## Extracting image URLs from a response

- **Search:** No image URLs. Use `response.objectIDs` to drive object fetches.
- **Object:** Main image = `object.primaryImage`. Thumbnail = `object.primaryImageSmall`. More images = `object.additionalImages` (array of URLs). Only use non-empty strings.

---

## TypeScript example

```ts
interface MetObject {
  objectID: number;
  title: string;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  additionalImages: string[];
  artistDisplayName: string;
  department: string;
}

interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

function getPrimaryImageUrl(obj: MetObject): string | null {
  return obj.primaryImage && obj.primaryImage.length > 0 ? obj.primaryImage : null;
}

async function searchMetAndGetImages(
  query: string,
  options: { maxResults?: number; publicDomainOnly?: boolean } = {}
) {
  const { maxResults = 25, publicDomainOnly = false } = options;

  const searchUrl = new URL("https://collectionapi.metmuseum.org/public/collection/v1/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("hasImages", "true");
  if (publicDomainOnly) searchUrl.searchParams.set("isPublicDomain", "true");

  const searchRes = await fetch(searchUrl);
  const searchData = (await searchRes.json()) as MetSearchResponse;

  const ids = searchData?.objectIDs ?? [];
  const results: { objectID: number; title: string; imageUrl: string }[] = [];

  for (let i = 0; i < Math.min(ids.length, maxResults); i++) {
    const objectRes = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${ids[i]}`
    );
    const obj = (await objectRes.json()) as MetObject;
    const imageUrl = getPrimaryImageUrl(obj);
    if (!imageUrl) continue;

    results.push({
      objectID: obj.objectID,
      title: obj.title ?? "",
      imageUrl,
    });
  }

  return results;
}
```

---

## Authentication and rate limits

- **No API key** required. The Met Collection API is open; see [Open Access at The Met](https://github.com/metmuseum/openaccess) and the [API terms](https://metmuseum.github.io/).
- **Rate limit:** Please limit requests to **80 requests per second**.
- **Data:** CC0 where applicable; includes identifying data for works under copyright. High-resolution images (JPEG) in the response are for works in Open Access (e.g. public domain).

---

## Common pitfalls

- **Search returns IDs only** — always fetch the object endpoint to get `primaryImage` and other fields.
- **`objectIDs` can be null** when there are no results; use `objectIDs ?? []`.
- **Empty `primaryImage`** — not every object has an image; check before using.
- **Department IDs** — use `GET /departments` to get valid `departmentId` values for search/objects.

---

## Recommended default approach

- **Search:**  
  `GET https://collectionapi.metmuseum.org/public/collection/v1/search?q=...&hasImages=true`

- **For each ID in `objectIDs`:**  
  `GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}`

- **Image URL:**  
  Use `object.primaryImage` (or `object.primaryImageSmall` for a smaller image). Omit objects with an empty `primaryImage`.

This is the most reliable way to get actual image URLs from The Metropolitan Museum of Art Collection API.

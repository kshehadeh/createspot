# Rijksmuseum API: Query → Actual Image URLs (Practical Guide)

This is a pragmatic "how do I get real image URLs back?" guide for the Rijksmuseum collection and image APIs.

The **big idea**:  
For **direct image URLs** with minimal friction, use the **Collection API** at `www.rijksmuseum.nl/api`. It returns `artObjects[]` with `webImage.url` and `headerImage.url` that you can use in `<img src="...">`. An **API key** is required (free from [Rijksstudio](https://www.rijksmuseum.nl/en/rijksstudio)). Use `imgonly=True` to return only objects that have an image. The **Data Search API** at `data.rijksmuseum.nl` needs no key but returns only object identifiers; resolving them to metadata (and IIIF image IDs) is a separate step.

---

## Two API surfaces

| API | Base URL | Auth | Returns image URLs? |
|-----|----------|------|----------------------|
| **Collection API** | `https://www.rijksmuseum.nl/api` | API key (mandatory) | Yes — `webImage.url`, `headerImage.url` |
| **Data Search API** | `https://data.rijksmuseum.nl/search/collection` | None | No — returns LOD identifiers; resolve + IIIF for images |

This guide focuses on the **Collection API** for getting actual image URLs, with a short note on the Data Search API.

---

## Collection API (recommended for image URLs)

### 1) Get an API key
Register for a [Rijksstudio account](https://www.rijksmuseum.nl/en/rijksstudio) and request an API key (available in Rijksstudio advanced settings). The key is required for every request.

### 2) Search the collection
Returns a list of objects with metadata and image links.

```
GET https://www.rijksmuseum.nl/api/{culture}/collection
  ?key=YOUR_API_KEY
  &q=YOUR_QUERY
  &imgonly=True
  &p=0
  &ps=100
```

- `key` — Your API key (required)
- `culture` — `en` or `nl` (language of request and results)
- `q` — Search terms (title, maker, description, etc.)
- `imgonly` — `True` to return only objects that have an image (recommended when you need images)
- `p` — Page index (0-based). **Note:** `p * ps` cannot exceed 10,000 total results
- `ps` — Page size (1–100, default 10)

Other useful parameters: `involvedMaker`, `type`, `material`, `technique`, `f.dating.period` (century), `toppieces`, `s` (sort: relevance, chronologic, achronologic, artist, etc.). See the [official Collection API docs](https://data.rijksmuseum.nl/object-metadata/api/#collection-api).

### 3) Single object details
Fetch one object by object number (from search results, e.g. `SK-C-5`).

```
GET https://www.rijksmuseum.nl/api/{culture}/collection/{object-number}?key=YOUR_API_KEY
```

Example:

```
GET https://www.rijksmuseum.nl/api/en/collection/SK-C-5?key=YOUR_API_KEY
```

---

## What "actual image" means in the response

**Search response** (`GET /api/{culture}/collection`): the response has `artObjects` (array). Each item can include:

- `hasImage` — boolean, whether the object has an image
- `webImage` — main web image: `url`, `width`, `height`, `guid`, offset fields
- `headerImage` — banner/crop variant: `url`, dimensions, etc.

Use `artObject.webImage.url` or `artObject.headerImage.url` directly in `<img src="...">`. These are full URLs (e.g. on `lh3.googleusercontent.com`).

**Single object response** (`GET /api/{culture}/collection/{object-number}`): same shape under `artObject` — `webImage.url`, `headerImage.url`, `hasImage`.

Example (snippet):

```json
{
  "artObjects": [
    {
      "id": "nl-SK-C-5",
      "objectNumber": "SK-C-5",
      "title": "The Night Watch",
      "hasImage": true,
      "webImage": {
        "url": "https://lh3.googleusercontent.com/...",
        "width": 2500,
        "height": 2034
      },
      "headerImage": {
        "url": "https://lh3.googleusercontent.com/...",
        "width": 1920,
        "height": 460
      },
      "principalOrFirstMaker": "Rembrandt van Rijn"
    }
  ],
  "count": 3491
}
```

---

## A working search strategy

### Step 1 — Require images
Set `imgonly=True` so only objects with an image are returned.

### Step 2 — Paginate
Use `p` (page index) and `ps` (page size, max 100). You cannot go beyond 10,000 results total (`p * ps < 10000`).

### Step 3 — Check before using URL
In code, only use `webImage.url` (or `headerImage.url`) when `hasImage === true` and the corresponding object exists.

---

## Extracting image URLs from a response

For each entry in `response.artObjects`:

- **Web image:** `artObject.webImage?.url`
- **Header image:** `artObject.headerImage?.url`

If `hasImage` is false, `webImage` / `headerImage` may be absent; guard accordingly.

---

## TypeScript example

```ts
interface RijksWebImage {
  url: string;
  width: number;
  height: number;
  guid?: string;
}

interface RijksArtObject {
  id: string;
  objectNumber: string;
  title: string;
  hasImage: boolean;
  webImage?: RijksWebImage;
  headerImage?: RijksWebImage;
  principalOrFirstMaker?: string;
  longTitle?: string;
}

interface RijksCollectionResponse {
  artObjects: RijksArtObject[];
  count: number;
  elapsedMilliseconds?: number;
}

function getWebImageUrl(obj: RijksArtObject): string | null {
  return obj.hasImage && obj.webImage?.url ? obj.webImage.url : null;
}

async function searchRijksWithImages(
  apiKey: string,
  query: string,
  options: { culture?: "en" | "nl"; maxResults?: number } = {}
) {
  const { culture = "en", maxResults = 25 } = options;
  const results: { objectNumber: string; title: string; imageUrl: string }[] = [];
  const ps = 100;
  let p = 0;

  while (results.length < maxResults) {
    const url = new URL(`https://www.rijksmuseum.nl/api/${culture}/collection`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("imgonly", "True");
    url.searchParams.set("p", String(p));
    url.searchParams.set("ps", String(ps));

    const res = await fetch(url);
    const data = (await res.json()) as RijksCollectionResponse;

    const objects = data?.artObjects ?? [];
    if (objects.length === 0) break;

    for (const obj of objects) {
      const imageUrl = getWebImageUrl(obj);
      if (!imageUrl) continue;

      results.push({
        objectNumber: obj.objectNumber,
        title: obj.title ?? "",
        imageUrl,
      });

      if (results.length >= maxResults) break;
    }

    p++;
    if (objects.length < ps) break;
    if (p * ps >= 10_000) break;
  }

  return results;
}
```

---

## Data Search API (no API key, identifiers only)

The [Data Search API](https://data.rijksmuseum.nl/docs/search) at `https://data.rijksmuseum.nl/search/collection` does **not** require an API key. It returns a **Linked Art Search** result: a list of **persistent identifiers** (e.g. `https://id.rijksmuseum.nl/200100988`), not full object records or image URLs.

- **Parameters:** `title`, `objectNumber`, `creator`, `creationDate`, `description`, `type`, `technique`, `material`, `aboutActor`, **`imageAvailable`** (boolean), `pageToken` (pagination).
- **Response:** `orderedItems` = array of object IDs; `partOf.totalItems`, `next.id` for next page (100 items per page).
- **To get image URLs:** You must resolve each identifier (e.g. via the [Linked Data Resolver](https://data.rijksmuseum.nl/docs/http)) to get metadata. Images are served via the [IIIF Image API](https://data.rijksmuseum.nl/docs/iiif/image) at `https://iiif.micr.io/{image-id}/full/max/0/default.png`; the IIIF image ID comes from the resolved metadata (D1_Digital_Object / E36_Visual_Item). For a straightforward "query → image URL" flow, the Collection API above is simpler.

---

## Authentication and limits

- **Collection API:** API key required; obtain from [Rijksstudio](https://www.rijksmuseum.nl/en/rijksstudio). Free.
- **Pagination:** Collection API returns at most 10,000 results per search (`p * ps` &lt; 10,000); `ps` max 100.
- **Data policy:** See [Rijksmuseum data policy](https://www.rijksmuseum.nl/en/data/policy) for use of data and images.

---

## Common pitfalls

- Forgetting the API key: the Collection API returns an error without `key`.
- Expecting image URLs from the Data Search API: it only returns identifiers; you need resolution + IIIF for images.
- Pagination beyond 10,000 results in the Collection API is not supported.

---

## Recommended default approach

- **Endpoint:**  
  `GET https://www.rijksmuseum.nl/api/{en|nl}/collection?key=YOUR_KEY&q=...&imgonly=True&p=0&ps=100`

- **Image URL:**  
  Use `artObject.webImage.url` (or `artObject.headerImage.url`) from each `artObjects[]` item where `hasImage` is true.

This is the most reliable way to get actual image URLs from the Rijksmuseum collection.

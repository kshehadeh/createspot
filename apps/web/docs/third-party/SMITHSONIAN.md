# Smithsonian Open Access API: Query → Actual Image URLs (Practical Guide)

This is a pragmatic "how do I get real image URLs back?" guide for the Smithsonian Open Access API.

The **big idea**:  
`online_media_type:Images` is **not a guarantee** that the API will include an actual image URL in the returned record. The only reliable indicator is the presence of an **`online_media.media[]`** array with `content` URLs.

---

## Endpoints you'll use

### 1) Search
Use this to find candidate records by keyword / boolean query.

```
GET https://api.si.edu/openaccess/api/v1.0/search
  ?api_key=YOUR_KEY
  &q=YOUR_QUERY
  &start=0
  &rows=25
```

- `q` supports boolean expressions like: `picasso AND online_media_type:Images`
- `start` is the offset for paging
- `rows` is page size

### 2) Content (optional but recommended)
Use this to fetch a single record in detail (sometimes you'll prefer this to relying only on the search payload).

```
GET https://api.si.edu/openaccess/api/v1.0/content/edanmdm:RECORD_ID
  ?api_key=YOUR_KEY
```

Example:

```
/content/edanmdm:nmah_557438?api_key=YOUR_KEY
```

---

## What "actual image" means in the response

A record has accessible image media **only if** this exists and is non-empty:

```
content.descriptiveNonRepeating.online_media.media[]
```

Each `media[]` entry can include:
- `content` → the URL you can fetch/display
- `thumbnail` → smaller version (often present)
- `type` → commonly `"image"`

---

## A working search strategy

### Step 1 — Start broad (good recall)

```
q=picasso AND online_media_type:Images
```

### Step 2 — Post-filter for real media (good precision)
After you get results, only keep records where:

```
content.descriptiveNonRepeating.online_media.media.length > 0
```

### Step 3 — Page until you've collected enough image records
Because many hits will be "image-tagged but no media URLs," you'll often need to paginate.

---

## Extracting image URLs from a search response

For each `row` in `response.rows`:

```
row.content.descriptiveNonRepeating.online_media.media[*].content
```

If that path doesn't exist, the record does **not** expose image files.

---

## TypeScript example

```ts
type SmithsonianRow = any;

function extractImageUrlsFromRow(row: SmithsonianRow): string[] {
  const media = row?.content?.descriptiveNonRepeating?.online_media?.media;
  if (!Array.isArray(media)) return [];

  return media
    .map((m: any) => m?.content)
    .filter((url: any) => typeof url === "string" && url.length > 0);
}
```

### Example: search and collect image records

```ts
async function searchImages(
  apiKey: string,
  query: string,
  targetCount = 25,
  pageSize = 50
) {
  const results: any[] = [];
  let start = 0;

  while (results.length < targetCount) {
    const url = new URL("https://api.si.edu/openaccess/api/v1.0/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("rows", String(pageSize));
    url.searchParams.set("start", String(start));

    const res = await fetch(url);
    const data = await res.json();

    const rows = data?.response?.rows ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const images = extractImageUrlsFromRow(row);
      if (images.length === 0) continue;

      results.push({
        id: row.id,
        title: row.title,
        unitCode: row.unitCode,
        recordId: row?.content?.descriptiveNonRepeating?.record_ID,
        guid: row?.content?.descriptiveNonRepeating?.guid,
        images,
      });

      if (results.length >= targetCount) break;
    }

    start += pageSize;
  }

  return results;
}
```

---

## When to use /content/:id

If you want to fetch a full record directly:

```
GET /content/edanmdm:RECORD_ID?api_key=YOUR_KEY
```

Then extract:

```
response.content.descriptiveNonRepeating.online_media.media[*].content
```

---

## Understanding the image URLs

Returned image URLs often look like:

```
https://ids.si.edu/ids/deliveryService?id=...
```

These are directly usable in `<img src="...">`.  
If available, prefer the provided `thumbnail` field for smaller images.

---

## Common pitfalls

- `online_media_type:Images` does not guarantee image URLs
- CC0 metadata does not guarantee downloadable media
- Pagination is required to find enough image-bearing records

---

## Recommended default approach

- **Query:**

  ```
  picasso AND online_media_type:Images
  ```

- **Filter:**

  ```
  content.descriptiveNonRepeating.online_media.media[].content
  ```

This is the most reliable way to retrieve actual image URLs from the Smithsonian Open Access API.

# Initial Render Baseline (Investigation)

How to collect document TTFB and chunking for the initial-render investigation.

## 1. Script (server must be running)

```bash
bun run apps/web/scripts/measure-document-timing.ts
# Or with custom base:
BASE_URL=http://localhost:3000 bun run apps/web/scripts/measure-document-timing.ts
```

Records for `/` and `/dashboard`:

- Time to response start (approximates TTFB)
- Time to full body
- Whether streaming markers (`$?`, `$!`, `$-->`) appear in the HTML
- Short HTML snippet

## 2. Browser DevTools

1. Open DevTools → Network.
2. Reload the page (or navigate to `/` and then to an app route like `/dashboard`).
3. Select the **document** request (first request, type "document").
4. In **Timing** (or the waterfall):
   - **Waiting (TTFB)**: time until first byte from server.
   - **Content Download**: time to receive full response.
5. In **Response** (or "View Source" on the doc request), search for:
   - `$?` – pending Suspense boundary (streaming)
   - `$!-->` – client boundary

If the document is streamed, the first chunk may arrive quickly while later chunks fill in dynamic segments; the waterfall will show the document request receiving data over time.

## 3. Performance tab (optional)

To compare JS/hydration cost vs server TTFB: open DevTools → Performance, record a load of `/`, then inspect the timeline for the document request (TTFB) and any long main-thread tasks.

## 4. Where to record results

- Paste script output or DevTools timing numbers into the investigation notes.
- Compare cold (first load after restart) vs warm (second load) to see cache impact.

## 5. Sample baseline and cold vs warm

| Route     | Response start (ms) | Body end (ms) | Streaming markers |
|----------|----------------------|---------------|-------------------|
| `/`      | 1186                 | 1224          | yes               |
| `/dashboard` | 46               | 109           | yes               |

Home document TTFB is much higher than dashboard on the same run, indicating server work (layout + page + exhibition fetch) is blocking first byte for `/`.

**Cold vs warm (two consecutive runs, same process):**

| Route   | First (response start) | Second (response start) |
|---------|------------------------|--------------------------|
| `/`     | 1176 ms                | 77 ms                    |
| `/dashboard` | 54 ms              | 39 ms                    |

Conclusion: Cache is very effective for home. Warm home TTFB drops to ~77 ms (vs ~1176 ms cold), so `HomeContent` / `getExhibitionSubmissions` cache is doing its job. The remaining delay on cold is dominated by layout i18n + page translations + uncached exhibition query; on warm, upstream work (i18n, etc.) still runs but data path is cached.

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

## 3. Where to record results

- Paste script output or DevTools timing numbers into the investigation notes.
- Compare cold (first load after restart) vs warm (second load) to see cache impact.

## 4. Server timing instrumentation

Temporary `[INIT-RENDER]` logs are added in development (disable with `INIT_RENDER_DEBUG=0`). After starting the dev server, load `/` or an app route and check the terminal for:

- `layout-public i18n` / `layout-public total` – (public) layout
- `page-home translations` / `page-home total` – home page
- `home-content getExhibitionSubmissions` / `home-content total` – grid data
- `layout-app auth+locale+messages` / `layout-app getTutorialData` / `layout-app total` – (app) layout
- `exhibition prisma.findMany (home)` – DB query for home grid

Use these to see which await dominates and to compare cold vs warm (run the measure script twice and compare both terminal logs and response times).

## 5. Client hydration (ExhibitionGrid)

With `NEXT_PUBLIC_INIT_RENDER_DEBUG` set (e.g. in `.env.local`: `NEXT_PUBLIC_INIT_RENDER_DEBUG=1`), the home grid client component records Performance marks:

- `exhibition-grid-render-start` – start of first render
- `exhibition-grid-hydration-done` – after first commit (useEffect)
- Measure: `exhibition-grid-hydration` – duration between them

To compare JS/hydration cost vs server TTFB:

1. Open DevTools → Performance.
2. Start recording, then load `/` (or refresh).
3. Stop when the page is interactive.
4. In the timeline, find the document request (TTFB) and the `exhibition-grid-hydration` measure (under User Timing).
5. If TTFB is much larger than the hydration measure, the delay is mostly server-side; if hydration is large, optimize client bundle or defer heavy components.

## 6. Sample baseline and cold vs warm

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

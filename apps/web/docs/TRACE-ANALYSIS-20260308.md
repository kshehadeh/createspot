# Chrome trace analysis – 2026-03-08

Analysis of `Trace-20260308T090620.json.gz` (DevTools Performance, https://www.create.spot/).

## Summary

| Metric | Value | Assessment |
|--------|--------|------------|
| **FCP** | 1,752 ms | Good |
| **LCP** | 2,892 ms | Fair; image is LCP element |
| **CLS** | 0.000142 | Excellent |
| **Long tasks (>50 ms)** | 0 | Good (INP-friendly) |
| **Trace window** | ~7.3 s | — |

LCP is driven by the **second** grid image (not the H1). The first LCP candidate was the H1 (text); the final LCP was an `IMG` in the exhibition grid with `loading="eager"` and size 155,630 px².

---

## Main-thread breakdown

- **Total script (v8/EvaluateScript/FunctionCall):** ~625 ms in trace window.
- **Longest single chunk:** ~31 ms (`EvaluateScript` for a Next.js chunk, e.g. `…70bb8a831ce7716d.js`). No task exceeds 50 ms.
- **Layout:** 7 ms total (7 events).
- **Recalculate styles:** &lt;1 ms.
- **Paint:** 487 events, ~22 ms total.
- **GC:** ~27 ms (MinorGC / GCScavenger); not dominant.

Conclusion: Main thread is not dominated by one long task; the main improvement lever is **LCP (image load timing)** and, secondarily, **reducing initial JS** to shorten the 31 ms parse/run.

---

## Opportunities

### 1. **Improve LCP by prioritizing the LCP image (high impact)**

- **Finding:** LCP element is the **second** grid image (candidateIndex 2). The home page uses `ExhibitionGrid` with `priorityCount={1}`, so only the first image gets `priority` and `fetchPriority="high"`.
- **Recommendation:** On the home page, set `priorityCount={2}` (or 3) so the first two (or three) grid images load with high priority. That directly targets the image that is currently winning LCP.
- **Where:** `apps/web/app/(public)/home-grid.tsx` — change `priorityCount={1}` to `priorityCount={2}` (tune to 3 if the third image is often above the fold).

### 2. **Preload the LCP image from the server (medium impact)**

- **Finding:** The LCP image URL is known on the server (from `getExhibitionSubmissions`). Preloading can start the request earlier than when the client renders the grid.
- **Recommendation:** In the home page or `HomeContent`, emit a `<link rel="preload" as="image" href={secondSubmission.imageUrl} />` for the second submission’s image (and optionally the first). Use the same `imageUrl` that `ExhibitionGrid` will use so the preload is reused.
- **Caveat:** Only add a preload for the first one or two images to avoid competing with other critical resources.

### 3. **Keep initial JS lean (lower priority)**

- **Finding:** ~31 ms for one EvaluateScript (Next.js chunk); total script ~625 ms in the trace window. No single long task.
- **Recommendation:** Continue current practices (code-splitting, lazy loading). If you add heavy dependencies to the shell or home route, monitor this chunk and consider dynamic imports for below-the-fold or non-critical features. No urgent change required from this trace.

### 4. **Layout / style / paint**

- Layout and style cost are minimal (7 ms and &lt;1 ms). Paint is moderate (22 ms). No change recommended from this trace.

---

## Quick win

**Change in `home-grid.tsx`:**

```tsx
priorityCount={2}  // was 1; LCP is the second grid image
```

Re-run a trace after the change and compare LCP (and, if available, image load times in the Network panel) to confirm improvement.

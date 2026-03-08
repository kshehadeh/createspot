# Initial Render: Prioritized Fix List

Based on the investigation (baseline TTFB, cold vs warm, server instrumentation, and client hydration markers). Root cause: **server-side blocking** (layout i18n + page translations + exhibition fetch) before first byte; cache helps warm requests but cold home TTFB stays high (~1.2s). Client hydration cost is secondary until measured in Production.

---

## 1. Unblock shell streaming (highest impact)

**Problem:** The entire document waits on layout + page + `HomeContent` before any HTML is sent. No route-level `loading.tsx` and `HomeContent` is not inside its own Suspense boundary, so the grid data fetch blocks the shell.

**Fixes (in order of impact):**

| Fix | Expected gain | Risk | Effort |
|-----|----------------|------|--------|
| Wrap `HomeContent` in `<Suspense fallback={…}>` with a grid skeleton (e.g. same layout, placeholder cards) so the shell (header, hero, footer) can stream first and the grid streams in when `getExhibitionSubmissions` resolves. | Large reduction in perceived delay: user sees shell in ~100–300 ms, grid follows. | Low. Cached `HomeContent` still benefits; fallback only shows on cold or cache miss. | Low |
| Add `loading.tsx` for `(public)` (and optionally for `(app)`) so route transitions show a loading UI instead of a blank or frozen shell. | Better perceived performance on navigation. | Low. | Low |
| Defer or stream i18n: ensure `getMessages()` / locale load don’t block the very first chunk. May require next-intl or framework support for streaming/dynamic messages. | Smaller TTFB if i18n is a major part of cold time. | Medium (API/limitations). | Medium |

**Fast experiment:** Add only the Suspense boundary around `HomeContent` with a minimal fallback (e.g. empty grid area or “Loading…”). Measure TTFB and first-paint in DevTools; compare cold vs warm.

---

## 2. Reduce server work on the critical path

**Problem:** Every request runs layout i18n (`getLocale`, `getMessages`, `getTranslations`) and page translations before sending content. Cold requests also run the exhibition query.

**Fixes:**

| Fix | Expected gain | Risk | Effort |
|-----|----------------|------|--------|
| Reduce or split message payload for above-the-fold: load only namespaces needed for the shell (e.g. `navigation`, `home`, `footer`) and defer the rest. | Lower parse/serialization and possibly faster first byte. | Low. | Medium |
| Ensure `generateMetadata()` for home doesn’t add duplicate translation work; reuse or share with page. | Small. | Low. | Low |
| Keep `"use cache"` and `cacheLife("minutes")` for `HomeContent` / `getExhibitionSubmissions`; consider longer cache for home if content freshness allows. | Warm requests stay fast. | Low (stale content). | Low |

**Fast experiment:** In `(public)/layout.tsx`, load a minimal set of message keys for the header and measure layout time with `[INIT-RENDER]` logs.

---

## 3. Database and query (cold request)

**Problem:** Cold home request pays for `getExhibitionSubmissions`: Prisma `findMany` with `include` (user, prompt, `_count`) and `orderBy createdAt DESC`.

**Fixes:**

| Fix | Expected gain | Risk | Effort |
|-----|----------------|------|--------|
| Add a composite index for the home feed: e.g. `(shareStatus, isPortfolio, createdAt DESC)` so the home query avoids a full scan + sort. | Shorter DB time on cold. | Low. | Low |
| Consider deferring `_count.favorites` to a follow-up or client fetch if it’s not critical for first paint. | Slightly simpler/faster query. | Low. | Medium |
| Keep `cacheLife("minutes")` and `cacheTag("exhibition-submissions")`; use `revalidatePath`/`updateTag` when content changes. | Warm requests stay cached. | Low. | Done |

**Fast experiment:** Add the composite index, restart DB, run cold home request and compare `[INIT-RENDER] exhibition prisma.findMany (home)` duration.

---

## 4. Client JS and hydration

**Problem:** Large client subtree (ExhibitionGrid, FavoritesProvider, motion, lightbox) can delay interactivity. Not yet confirmed as the main bottleneck vs server TTFB.

**Fixes (after measuring with User Timing / Performance tab):**

| Fix | Expected gain | Risk | Effort |
|-----|----------------|------|--------|
| Lazy-load or defer heavy client chunks (e.g. lightbox, framer-motion) until after first paint or on interaction. | Faster first paint and hydration if bundle is large. | Medium (UX: animation/lightbox availability). | Medium |
| Use `priorityCount={1}` (or small N) so only the first image is high priority; keep rest lazy. | Already in place; verify in Production. | Low. | Done |
| Reduce or conditionally load SessionProvider / next-auth on home if not needed above the fold. | Smaller client bundle for anonymous home. | Low. | Low |

**Fast experiment:** With `NEXT_PUBLIC_INIT_RENDER_DEBUG=1`, record Performance timeline, compare `exhibition-grid-hydration` measure to document TTFB. If hydration is a large share of “time to interactive,” apply one of the above.

---

## 5. Root and app layout

**Problem:** Root layout uses a single Suspense with a minimal fallback; app layout awaits `auth()`, i18n, and `getTutorialData()` before rendering.

**Fixes:**

| Fix | Expected gain | Risk | Effort |
|-----|----------------|------|--------|
| Move `getTutorialData()` into a Suspense boundary with `fallback={null}` or a small placeholder so header + children can stream before tutorial data. | App routes show shell sooner. | Low. | Low |
| Keep root Suspense fallback minimal; ensure theme/fonts don’t block first paint. | Minor. | Low. | Low |

**Fast experiment:** Wrap `getTutorialData` (and any UI that depends on it) in Suspense and reload an app route; compare TTFB with `[INIT-RENDER] layout-app getTutorialData` log.

---

## Summary

- **Do first:** Wrap `HomeContent` in Suspense with a grid skeleton so the shell streams and the grid streams in when data is ready. Add `loading.tsx` for the public (and optionally app) segment.
- **Then:** Add DB composite index for home feed; optionally reduce/split i18n payload for the shell.
- **Then:** Defer heavy client modules if hydration User Timing shows they matter; wrap `getTutorialData` in Suspense for app routes.

Re-run the measure script and `[INIT-RENDER]` logs after each change to confirm impact.

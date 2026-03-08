# Inspecting PPR / Cache Boundaries

Ways to see how a page is split into static, cached, and dynamic parts.

## 1. View Page Source

Open the page, then **View Page Source** (or inspect the initial HTML in the Network tab for the document request).

Look for React streaming comments:

- `<!--$?-->` – Pending Suspense boundary (dynamic segment; content streams in later)
- `<!--$-->` / `<!--/$-->` – Boundary markers
- `<!--$!-->` – Client boundary

Static/cached HTML is the actual DOM nodes. Dynamic segments appear as these comment placeholders (and possibly `<template>` tags) until the stream delivers the content.

## 2. Extract RSC Payload (Console)

In the browser console on a Next.js page:

```js
(() => {
  const env = { self: {} };
  Array.from(document.body.querySelectorAll("script"))
    .filter((s) => s.textContent?.includes("self.__next_f"))
    .forEach((s) => {
      try {
        new Function("self", s.textContent)(env.self);
      } catch (_) {}
    });
  return env.self.__next_f;
})();
```

This returns the Flight/RSC payload array. Chunks with `c[0] === 1` are string segments; joining them gives the serialized RSC tree (opaque format, but shows structure and boundaries).

## 3. Network Tab

- Select the **document** request (the HTML for the route).
- Inspect the response body: it may be streamed (chunks over time). The first chunk is the static shell; later chunks fill in dynamic Suspense boundaries.
- Search the response for `$?` or `$!` to find boundary comments.

## 4. React DevTools

Use React DevTools to see the component tree. Server vs client components appear as normal components; the tree structure reflects where Suspense boundaries are (dynamic content is under those boundaries).

---

Next.js does not add custom `data-*` attributes for PPR. The only “internal markers” in the HTML are React’s streaming comments and the RSC payload in `<script>` tags.

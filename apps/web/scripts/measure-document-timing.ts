/**
 * Measures document request timing for initial-render investigation.
 * Run with dev server up: bun run apps/web/scripts/measure-document-timing.ts
 * Optionally: BASE_URL=http://localhost:3000 bun run apps/web/scripts/measure-document-timing.ts
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

interface TimingResult {
  url: string;
  responseStartMs: number;
  bodyEndMs: number;
  status: number;
  hasStreamingMarker: boolean;
  snippet: string;
}

async function measureDocument(url: string): Promise<TimingResult> {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const start = performance.now();
  const res = await fetch(fullUrl, {
    redirect: "follow",
    headers: { Accept: "text/html" },
  });
  const responseStartMs = Math.round(performance.now() - start);
  const html = await res.text();
  const bodyEndMs = Math.round(performance.now() - start);

  const hasStreamingMarker =
    html.includes("$?") || html.includes("$!") || html.includes("$-->");
  const snippet = html.slice(0, 1200).replace(/\s+/g, " ").trim();

  return {
    url: fullUrl,
    responseStartMs,
    bodyEndMs,
    status: res.status,
    hasStreamingMarker,
    snippet: snippet.slice(0, 400) + (snippet.length > 400 ? "..." : ""),
  };
}

async function main() {
  console.log(
    "Document timing (dev server must be running at",
    BASE_URL,
    ")\n",
  );

  const routes = [
    { path: "/", label: "Home (public)" },
    { path: "/dashboard", label: "Dashboard (app)" },
  ];

  for (const { path, label } of routes) {
    try {
      const result = await measureDocument(path);
      console.log(label, path);
      console.log("  status:", result.status);
      console.log("  response start (ms):", result.responseStartMs);
      console.log("  body end (ms):", result.bodyEndMs);
      console.log("  streaming markers in HTML:", result.hasStreamingMarker);
      console.log("  HTML snippet:", result.snippet);
      console.log("");
    } catch (e) {
      console.error(label, path, "failed:", e);
      console.log("");
    }
  }
}

main();

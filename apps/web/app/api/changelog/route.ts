import { NextResponse } from "next/server";

interface GithubRelease {
  tag_name: string;
  published_at: string;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
}

export interface ChangelogRelease {
  tagName: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
}

function parseLimit(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const asNumber = Number.parseInt(value, 10);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return fallback;
  return Math.min(asNumber, 50);
}

function parseRepo(raw: string | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  const parts = s.split("/").filter(Boolean);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return `${parts[0]}/${parts[1]}`;
}

function nextLinkUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const m = /<([^>]+)>;\s*rel="next"/.exec(part.trim());
    if (m?.[1]) return m[1];
  }
  return null;
}

function mapRelease(r: GithubRelease): ChangelogRelease {
  return {
    tagName: r.tag_name,
    publishedAt: r.published_at,
    body: r.body?.trim() ?? "",
    htmlUrl: r.html_url,
  };
}

type FetchResult =
  | { ok: true; releases: ChangelogRelease[]; hasMore: boolean }
  | { ok: false; error: string };

async function fetchPublicReleases(
  repo: string,
  limit: number,
  token: string | undefined,
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "prompts-web-changelog",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const collected: ChangelogRelease[] = [];
  let url: string | null =
    `https://api.github.com/repos/${repo}/releases?per_page=100&page=1`;
  let hasMore = false;

  while (url && collected.length < limit) {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return { ok: false, error: `GitHub API returned ${res.status}` };
    }

    const batch = (await res.json()) as GithubRelease[];
    if (!Array.isArray(batch)) {
      return { ok: false, error: "Invalid GitHub API response" };
    }

    for (const r of batch) {
      if (r.draft || r.prerelease) continue;
      collected.push(mapRelease(r));
      if (collected.length >= limit) break;
    }

    const nextUrl = nextLinkUrl(res.headers.get("link"));
    if (collected.length >= limit) {
      hasMore = nextUrl !== null;
      break;
    }
    if (!nextUrl || batch.length === 0) {
      hasMore = false;
      break;
    }
    url = nextUrl;
  }

  return {
    ok: true,
    releases: collected.slice(0, limit),
    hasMore,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"), 10);

  const repo = parseRepo(process.env["CHANGELOG_GITHUB_REPO"]);
  if (!repo) {
    return NextResponse.json(
      {
        error: "CHANGELOG_GITHUB_REPO is not configured",
        releases: [] as ChangelogRelease[],
        hasMore: false,
      },
      { status: 503 },
    );
  }

  const token = process.env["GITHUB_TOKEN"]?.trim() || undefined;
  const result = await fetchPublicReleases(repo, limit, token);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        releases: [] as ChangelogRelease[],
        hasMore: false,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    releases: result.releases,
    hasMore: result.hasMore,
  });
}

import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

interface ChangelogEntry {
  time: string;
  commit: string;
  type: "fix" | "improvement" | "feature" | "documentation" | string;
  audience?: "public" | "development";
  area: string;
  description: string;
  impact?: "patch" | "minor" | "major";
  version?: string;
}

function parseLimit(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const asNumber = Number.parseInt(value, 10);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return fallback;
  return Math.min(asNumber, 50);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"), 10);
  const audience = searchParams.get("audience") ?? "public";

  const changelogsDir = path.join(process.cwd(), "changelogs");
  const fileNames = (await readdir(changelogsDir)).filter((fileName) =>
    fileName.endsWith(".json"),
  );

  const allEntries: ChangelogEntry[] = [];
  for (const fileName of fileNames) {
    const filePath = path.join(changelogsDir, fileName);
    const fileContent = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(fileContent) as ChangelogEntry[];
    allEntries.push(...parsed);
  }

  const filteredEntries =
    audience === "all"
      ? allEntries
      : allEntries.filter((entry) => (entry.audience ?? "public") === audience);

  filteredEntries.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  return NextResponse.json({
    entries: filteredEntries.slice(0, limit),
    total: filteredEntries.length,
  });
}
